import type { AuthSession, AuthSessionSnapshot, SessionResponse } from "@/features/auth/auth-types";

const SESSION_ENDPOINT_PATH = "/api/auth/session";
const REFETCH_RATE_LIMIT_MS = 5_000;

const sessionSubscribers = new Set<() => void>();

let sessionState: AuthSessionSnapshot = {
  status: "idle",
  session: null,
};

let pendingSessionRequest: Promise<void> | null = null;
let lastSessionRequestAt = 0;

const sessionSyncController = createSessionSyncController({
  getSessionSnapshot,
  isSessionRefetchAllowed,
  refreshSession,
  setSessionState,
});

export function subscribeToSessionStore(listener: () => void) {
  sessionSubscribers.add(listener);

  return function unsubscribeSessionStore() {
    sessionSubscribers.delete(listener);
  };
}

export function getSessionSnapshot() {
  return sessionState;
}

export function setSessionState(nextState: AuthSessionSnapshot) {
  if (isSameSessionSnapshot(sessionState, nextState)) {
    return;
  }

  sessionState = nextState;
  notifySessionSubscribers();
}

export function isSessionIdle() {
  return sessionState.status === "idle";
}

export function isSessionRefetchAllowed() {
  return Date.now() - lastSessionRequestAt >= REFETCH_RATE_LIMIT_MS;
}

export async function refreshSession(): Promise<SessionResponse> {
  if (pendingSessionRequest) {
    await pendingSessionRequest;

    return createSessionResponseFromSnapshot(getSessionSnapshot());
  }

  setSessionState({
    status: "loading",
    session: sessionState.session,
  });

  pendingSessionRequest = executeSessionRefresh();

  try {
    await pendingSessionRequest;
  } finally {
    pendingSessionRequest = null;
  }

  return createSessionResponseFromSnapshot(getSessionSnapshot());
}

export function createSessionSyncController(input: {
  getSessionSnapshot: () => AuthSessionSnapshot;
  isSessionRefetchAllowed: () => boolean;
  refreshSession: () => Promise<SessionResponse>;
  setSessionState: (nextState: AuthSessionSnapshot) => void;
}) {
  let syncChannel: BroadcastChannel | null = null;
  let syncInitialized = false;

  return {
    ensureSessionSyncInitialized() {
      if (syncInitialized || typeof window === "undefined") {
        return;
      }

      syncInitialized = true;

      initSessionSync();
      initVisibilityRefresh();
      initWindowFocusRefresh();
      initOnlineRecovery();
    },
    broadcastSessionChanged() {
      syncChannel?.postMessage("session-changed" satisfies SyncSignal);
    },
    broadcastSignedOut() {
      syncChannel?.postMessage("signed-out" satisfies SyncSignal);
    },
  };

  function initSessionSync() {
    if (typeof BroadcastChannel === "undefined") {
      return;
    }

    syncChannel?.close();
    syncChannel = new BroadcastChannel("auth-sync");
    syncChannel.onmessage = handleSyncMessage;
  }

  function handleSyncMessage(event: MessageEvent) {
    const signal = event.data;

    if (!isSyncSignal(signal)) {
      return;
    }

    if (signal === "signed-out") {
      input.setSessionState({
        status: "unauthenticated",
        session: null,
      });
      return;
    }

    if (!isOnline() || !input.isSessionRefetchAllowed()) {
      return;
    }

    void input.refreshSession();
  }

  function initVisibilityRefresh() {
    if (typeof document === "undefined") {
      return;
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
  }

  function handleVisibilityChange() {
    if (document.visibilityState !== "visible") {
      return;
    }

    if (input.getSessionSnapshot().status !== "authenticated") {
      return;
    }

    if (!isOnline() || !input.isSessionRefetchAllowed()) {
      return;
    }

    void input.refreshSession();
  }

  function initWindowFocusRefresh() {
    if (typeof window === "undefined") {
      return;
    }

    window.addEventListener("focus", handleWindowFocus);
  }

  function handleWindowFocus() {
    if (input.getSessionSnapshot().status !== "authenticated") {
      return;
    }

    if (!isOnline() || !input.isSessionRefetchAllowed()) {
      return;
    }

    void input.refreshSession();
  }

  function initOnlineRecovery() {
    if (typeof window === "undefined") {
      return;
    }

    window.addEventListener("online", handleOnlineRecovery);
  }

  function handleOnlineRecovery() {
    if (input.getSessionSnapshot().status !== "authenticated") {
      return;
    }

    if (!input.isSessionRefetchAllowed()) {
      return;
    }

    void input.refreshSession();
  }
}

export const ensureSessionSyncInitialized = sessionSyncController.ensureSessionSyncInitialized;
export const broadcastSessionChanged = sessionSyncController.broadcastSessionChanged;
export const broadcastSignedOut = sessionSyncController.broadcastSignedOut;

type SyncSignal = "session-changed" | "signed-out";

async function executeSessionRefresh() {
  lastSessionRequestAt = Date.now();

  const response = await requestSessionEndpoint();

  if (!response.ok) {
    if (sessionState.session) {
      setSessionState({
        status: "authenticated",
        session: sessionState.session,
      });
    } else {
      setSessionState({
        status: "unauthenticated",
        session: null,
      });
    }

    return;
  }

  setSessionState({
    status: response.data.session ? "authenticated" : "unauthenticated",
    session: response.data.session,
  });
}

async function requestSessionEndpoint(): Promise<SessionResponse> {
  try {
    const response = await fetch(SESSION_ENDPOINT_PATH, {
      method: "GET",
      cache: "no-store",
    });
    const rawPayload = (await response.json()) as unknown;

    if (isSessionResponse(rawPayload)) {
      return rawPayload;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth-client]", SESSION_ENDPOINT_PATH, error);
    }
  }

  return {
    ok: false,
    errorCode: "UNKNOWN_ERROR",
  };
}

function notifySessionSubscribers() {
  for (const subscriber of sessionSubscribers) {
    subscriber();
  }
}

function createSessionResponseFromSnapshot(snapshot: AuthSessionSnapshot): SessionResponse {
  return {
    ok: true,
    data: {
      session: snapshot.session,
    },
  };
}

function isSameSessionSnapshot(current: AuthSessionSnapshot, next: AuthSessionSnapshot) {
  if (current.status !== next.status) {
    return false;
  }

  return isSameSession(current.session, next.session);
}

function isSameSession(current: AuthSession | null, next: AuthSession | null) {
  if (!current && !next) {
    return true;
  }

  if (!current || !next) {
    return false;
  }

  return (
    current.user.id === next.user.id &&
    current.user.email === next.user.email &&
    current.user.name === next.user.name &&
    current.user.avatarUrl === next.user.avatarUrl
  );
}

function isSessionResponse(value: unknown): value is SessionResponse {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Record<string, unknown>;

  if (payload.ok === true) {
    return "data" in payload;
  }

  if (payload.ok === false) {
    return typeof payload.errorCode === "string";
  }

  return false;
}

function isSyncSignal(value: unknown): value is SyncSignal {
  return value === "session-changed" || value === "signed-out";
}

function isOnline() {
  return typeof navigator === "undefined" || navigator.onLine;
}
