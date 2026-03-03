"use client";

import { useEffect, useSyncExternalStore } from "react";
import type {
  AuthClient,
  AuthResponse,
  AuthSession,
  AuthSessionPayload,
  AuthSessionSnapshot,
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
    broadcastSessionChanged();
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

export function useSession(): AuthSessionSnapshot {
  const snapshot = useSyncExternalStore(
    subscribeToSessionStore,
    getSessionSnapshot,
    getSessionSnapshot
  );

  useEffect(() => {
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
    setSessionState({
      status: "unauthenticated",
      session: null,
    });

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

function initSessionSync() {
  if (typeof BroadcastChannel === "undefined") {
    return;
  }

  syncChannel = new BroadcastChannel("auth-sync");
  syncChannel.onmessage = handleSyncMessage;
}

function handleSyncMessage(event: MessageEvent) {
  if (!isSyncSignal(event.data)) {
    return;
  }

  if (!isOnline() || !isRefetchAllowed()) {
    return;
  }

  void refreshSession();
}

function broadcastSessionChanged() {
  syncChannel?.postMessage("session-changed");
}

function isSyncSignal(value: unknown): value is string {
  return value === "session-changed";
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

if (typeof window !== "undefined") {
  initSessionSync();
  initVisibilityRefresh();
  initOnlineRecovery();
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
