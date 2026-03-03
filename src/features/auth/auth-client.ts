"use client";

import { useEffect, useSyncExternalStore } from "react";
import type {
  AuthClient,
  ConfirmEmailChangePayload,
  ConfirmEmailChangeResponse,
  AuthResponse,
  AuthSession,
  AuthSessionPayload,
  AuthSessionSnapshot,
  RequestEmailChangePayload,
  RequestEmailChangeResponse,
  RequestEmailVerificationPayload,
  RequestEmailVerificationResponse,
  ResetPasswordPayload,
  ResetPasswordResponse,
  AuthSignOutPayload,
  SessionResponse,
  SignInResponse,
  SignOutResponse,
  SignUpResponse,
  VerifyEmailPayload,
  VerifyEmailResponse,
} from "@/features/auth/auth-contract";
import type { SignInInput, SignUpInput } from "@/features/auth/auth-schemas";

const SESSION_ENDPOINT_PATH = "/api/auth/session";
const SIGN_IN_ENDPOINT_PATH = "/api/auth/sign-in";
const SIGN_UP_ENDPOINT_PATH = "/api/auth/sign-up";
const SIGN_OUT_ENDPOINT_PATH = "/api/auth/sign-out";
const VERIFY_EMAIL_ENDPOINT_PATH = "/api/auth/verify-email";
const RESET_PASSWORD_ENDPOINT_PATH = "/api/auth/reset-password";
const REQUEST_EMAIL_VERIFICATION_ENDPOINT_PATH = "/api/auth/request-email-verification";
const REQUEST_EMAIL_CHANGE_ENDPOINT_PATH = "/api/auth/request-email-change";
const CONFIRM_EMAIL_CHANGE_ENDPOINT_PATH = "/api/auth/confirm-email-change";

/** Min interval between refetches from cross-tab sync, tab focus, or online recovery. */
const REFETCH_RATE_LIMIT_MS = 5_000;

const sessionSubscribers = new Set<() => void>();

let sessionState: AuthSessionSnapshot = {
  status: "idle",
  session: null,
};

let pendingSessionRequest: Promise<void> | null = null;
let lastSessionRequestAt = 0;
let syncChannel: BroadcastChannel | null = null;
let syncInitialized = false;

export const authClient: AuthClient = {
  signIn,
  signUp,
  signOut,
  useSession,
};

export type ResetPasswordWithTokenInput = {
  token: string;
  password: string;
  confirmPassword: string;
};

export type RequestEmailChangeInput = {
  newEmail: string;
};

export type ConfirmEmailChangeInput = {
  token: string;
  password: string;
};

export async function signIn(input: SignInInput): Promise<SignInResponse> {
  const response = await requestAuthEndpoint<AuthSessionPayload>(SIGN_IN_ENDPOINT_PATH, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
    },
  });

  if (response.ok) {
    setSessionState({
      status: response.data.session ? "authenticated" : "unauthenticated",
      session: response.data.session,
    });
    broadcastSessionChanged();
  }

  return response;
}

export async function signUp(input: SignUpInput): Promise<SignUpResponse> {
  const response = await requestAuthEndpoint<AuthSessionPayload>(SIGN_UP_ENDPOINT_PATH, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
    },
  });

  if (response.ok) {
    setSessionState({
      status: response.data.session ? "authenticated" : "unauthenticated",
      session: response.data.session,
    });
    broadcastSessionChanged();
  }

  return response;
}

export async function signOut(): Promise<SignOutResponse> {
  const response = await requestAuthEndpoint<AuthSignOutPayload>(SIGN_OUT_ENDPOINT_PATH, {
    method: "POST",
  });

  if (response.ok) {
    setSessionState({
      status: "unauthenticated",
      session: null,
    });
    broadcastSignedOut();
  }

  return response;
}

export async function verifyEmailToken(token: string): Promise<VerifyEmailResponse> {
  const response = await requestAuthEndpoint<VerifyEmailPayload>(VERIFY_EMAIL_ENDPOINT_PATH, {
    method: "POST",
    body: JSON.stringify({ token }),
    headers: {
      "content-type": "application/json",
    },
  });

  if (response.ok) {
    setSessionState({
      status: response.data.session ? "authenticated" : "unauthenticated",
      session: response.data.session,
    });
    broadcastSessionChanged();
  }

  return response;
}

export async function resetPasswordWithToken(
  input: ResetPasswordWithTokenInput
): Promise<ResetPasswordResponse> {
  const response = await requestAuthEndpoint<ResetPasswordPayload>(RESET_PASSWORD_ENDPOINT_PATH, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
    },
  });

  if (response.ok) {
    setSessionState({
      status: "unauthenticated",
      session: null,
    });
    broadcastSessionChanged();
  }

  return response;
}

export async function requestEmailVerification(): Promise<RequestEmailVerificationResponse> {
  return requestAuthEndpoint<RequestEmailVerificationPayload>(
    REQUEST_EMAIL_VERIFICATION_ENDPOINT_PATH,
    {
      method: "POST",
    }
  );
}

export async function requestEmailChange(
  input: RequestEmailChangeInput
): Promise<RequestEmailChangeResponse> {
  return requestAuthEndpoint<RequestEmailChangePayload>(REQUEST_EMAIL_CHANGE_ENDPOINT_PATH, {
    method: "POST",
    body: JSON.stringify(input),
    headers: {
      "content-type": "application/json",
    },
  });
}

export async function confirmEmailChange(
  input: ConfirmEmailChangeInput
): Promise<ConfirmEmailChangeResponse> {
  const response = await requestAuthEndpoint<ConfirmEmailChangePayload>(
    CONFIRM_EMAIL_CHANGE_ENDPOINT_PATH,
    {
      method: "POST",
      body: JSON.stringify(input),
      headers: {
        "content-type": "application/json",
      },
    }
  );

  if (response.ok) {
    setSessionState({
      status: response.data.session ? "authenticated" : "unauthenticated",
      session: response.data.session,
    });
    broadcastSessionChanged();
  }

  return response;
}

export function useSession(): AuthSessionSnapshot {
  const snapshot = useSyncExternalStore(
    subscribeToSessionStore,
    getSessionSnapshot,
    getSessionSnapshot
  );

  useEffect(() => {
    ensureSessionSyncInitialized();

    if (snapshot.status === "idle") {
      void refreshSession();
    }
  }, [snapshot.status]);

  return snapshot;
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

  const response = await requestAuthEndpoint<AuthSessionPayload>(SESSION_ENDPOINT_PATH, {
    method: "GET",
    cache: "no-store",
  });

  if (!response.ok) {
    // Transient error — restore previous session if we had one.
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

function setSessionState(nextState: AuthSessionSnapshot) {
  if (isSameSessionSnapshot(sessionState, nextState)) {
    return;
  }

  sessionState = nextState;
  notifySessionSubscribers();
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
    current.user.verified === next.user.verified &&
    current.user.avatarUrl === next.user.avatarUrl
  );
}

function notifySessionSubscribers() {
  for (const subscriber of sessionSubscribers) {
    subscriber();
  }
}

function subscribeToSessionStore(listener: () => void) {
  sessionSubscribers.add(listener);

  return function unsubscribeSessionStore() {
    sessionSubscribers.delete(listener);
  };
}

function getSessionSnapshot() {
  return sessionState;
}

function createSessionResponseFromSnapshot(snapshot: AuthSessionSnapshot): SessionResponse {
  return {
    ok: true,
    data: {
      session: snapshot.session,
    },
  };
}

// Cross-tab sync: signal-based — each tab refetches from server independently.

function ensureSessionSyncInitialized() {
  if (syncInitialized || typeof window === "undefined") {
    return;
  }

  syncInitialized = true;

  initSessionSync();
  initVisibilityRefresh();
  initOnlineRecovery();
}

function initSessionSync() {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  // Close prior channel if module was re-evaluated (HMR safety).
  syncChannel?.close();

  syncChannel = new BroadcastChannel("auth-sync");
  syncChannel.onmessage = handleSyncMessage;
}

function handleSyncMessage(event: MessageEvent) {
  const signal = event.data;

  if (!isSyncSignal(signal)) {
    return;
  }

  // Sign-out signals bypass rate limiting and immediately clear local state.
  // The auth cookie is already cleared (cookies are shared across tabs),
  // so no server roundtrip is needed.
  if (signal === "signed-out") {
    setSessionState({
      status: "unauthenticated",
      session: null,
    });
    return;
  }

  if (!isOnline() || !isRefetchAllowed()) {
    return;
  }

  void refreshSession();
}

type SyncSignal = "session-changed" | "signed-out";

function broadcastSessionChanged() {
  syncChannel?.postMessage("session-changed" satisfies SyncSignal);
}

function broadcastSignedOut() {
  syncChannel?.postMessage("signed-out" satisfies SyncSignal);
}

function isSyncSignal(value: unknown): value is SyncSignal {
  return value === "session-changed" || value === "signed-out";
}

// Visibility & online refetch

function isOnline() {
  return typeof navigator === "undefined" || navigator.onLine;
}

function isRefetchAllowed() {
  return Date.now() - lastSessionRequestAt >= REFETCH_RATE_LIMIT_MS;
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

  if (sessionState.status !== "authenticated") {
    return;
  }

  if (!isOnline() || !isRefetchAllowed()) {
    return;
  }

  void refreshSession();
}

function initOnlineRecovery() {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("online", handleOnlineRecovery);
}

function handleOnlineRecovery() {
  if (sessionState.status !== "authenticated") {
    return;
  }

  if (!isRefetchAllowed()) {
    return;
  }

  void refreshSession();
}

async function requestAuthEndpoint<TData>(
  path: string,
  init: RequestInit
): Promise<AuthResponse<TData>> {
  try {
    const response = await fetch(path, {
      ...init,
      cache: init.cache ?? "no-store",
    });

    const rawPayload = await parseJsonResponse(response);

    if (isAuthResponse<TData>(rawPayload)) {
      return rawPayload;
    }
  } catch (error) {
    if (process.env.NODE_ENV === "development") {
      console.error("[auth-client]", path, error);
    }

    return {
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    };
  }

  return {
    ok: false,
    errorCode: "UNKNOWN_ERROR",
  };
}

function isAuthResponse<TData>(value: unknown): value is AuthResponse<TData> {
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

async function parseJsonResponse(response: Response) {
  try {
    return (await response.json()) as unknown;
  } catch {
    return null;
  }
}
