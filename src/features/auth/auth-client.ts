"use client";

import { startTransition, useSyncExternalStore } from "react";
import type {
  ConfirmEmailChangeResponse,
  AuthSession,
  AuthSessionSnapshot,
  RequestEmailVerificationInput,
  RequestEmailVerificationResponse,
  RequestPasswordResetInput,
  RequestPasswordResetResponse,
  ResetPasswordResponse,
  SessionResponse,
  SignInResponse,
  SignOutResponse,
  SignUpActionInput,
  SignUpResponse,
} from "@/features/auth/auth-contract";
import {
  confirmEmailChangeAction,
  requestEmailVerificationAction,
  requestPasswordResetAction,
  resetPasswordAction,
  signInAction,
  signOutAction,
  signUpAction,
} from "@/features/auth/auth-actions";
import type { SignInInput } from "@/features/auth/auth-schemas";
import { runAsyncTransition } from "@/lib/app-utils";

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
let syncChannel: BroadcastChannel | null = null;
let syncInitialized = false;

export async function signIn(input: SignInInput): Promise<SignInResponse> {
  const response = await runAsyncTransition(() => signInAction(input));

  if (response.ok) {
    startTransition(() => {
      setSessionState({
        status: response.data.session ? "authenticated" : "unauthenticated",
        session: response.data.session,
      });
    });
    broadcastSessionChanged();
  }

  return response;
}

export async function signUp(input: SignUpActionInput): Promise<SignUpResponse> {
  const response = await runAsyncTransition(() => signUpAction(input));

  if (response.ok) {
    startTransition(() => {
      setSessionState({
        status: "unauthenticated",
        session: null,
      });
    });
  }

  return response;
}

export async function signOut(): Promise<SignOutResponse> {
  const response = await runAsyncTransition(() => signOutAction());

  if (response.ok) {
    startTransition(() => {
      setSessionState({
        status: "unauthenticated",
        session: null,
      });
    });
    broadcastSignedOut();
  }

  return response;
}

export async function resetPasswordWithToken(input: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<ResetPasswordResponse> {
  const response = await runAsyncTransition(() => resetPasswordAction(input));

  if (response.ok) {
    startTransition(() => {
      setSessionState({
        status: "unauthenticated",
        session: null,
      });
    });
    broadcastSessionChanged();
  }

  return response;
}

export async function requestPasswordReset(
  input: RequestPasswordResetInput
): Promise<RequestPasswordResetResponse> {
  return await runAsyncTransition(() => requestPasswordResetAction(input));
}

export async function requestEmailVerification(
  input: RequestEmailVerificationInput
): Promise<RequestEmailVerificationResponse> {
  return await runAsyncTransition(() => requestEmailVerificationAction(input));
}

export async function confirmEmailChange(input: {
  token: string;
  password: string;
}): Promise<ConfirmEmailChangeResponse> {
  const response = await runAsyncTransition(() => confirmEmailChangeAction(input));

  if (response.ok) {
    startTransition(() => {
      setSessionState({
        status: "unauthenticated",
        session: null,
      });
    });
    broadcastSignedOut();
  }

  return response;
}

export function useSession(): AuthSessionSnapshot {
  return useSyncExternalStore(subscribeToSessionStore, getSessionSnapshot, getSessionSnapshot);
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
  ensureSessionSyncInitialized();

  if (sessionState.status === "idle") {
    void refreshSession();
  }

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
  initWindowFocusRefresh();
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

  if (!isOnline()) {
    return;
  }

  if (!isRefetchAllowed()) {
    return;
  }

  void refreshSession();
}

function initWindowFocusRefresh() {
  if (typeof window === "undefined") {
    return;
  }

  window.addEventListener("focus", handleWindowFocus);
}

function handleWindowFocus() {
  if (sessionState.status !== "authenticated") {
    return;
  }

  if (!isOnline()) {
    return;
  }

  if (!isRefetchAllowed()) {
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
