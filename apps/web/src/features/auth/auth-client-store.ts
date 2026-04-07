import type { AuthSession, AuthSessionSnapshot, SessionResponse } from "@/features/auth/auth-types";

const SESSION_ENDPOINT_PATH = "/api/auth/session";

/** Min interval between refetches from cross-tab sync, tab focus, or online recovery. */
const REFETCH_RATE_LIMIT_MS = 5_000;

const sessionSubscribers = new Set<() => void>();

let sessionState: AuthSessionSnapshot = {
  status: "idle",
  session: null,
};

let pendingSessionRequest: Promise<void> | null = null;
let lastSessionRequestAt = 0;

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

  const session = response.data.session;

  setSessionState({
    status: session ? "authenticated" : "unauthenticated",
    session,
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
