"use client";

import { startTransition, useSyncExternalStore } from "react";
import type {
  ConfirmEmailChangeResponse,
  AuthSessionSnapshot,
  RequestEmailVerificationResponse,
  RequestPasswordResetResponse,
  ResetPasswordResponse,
  SignInResponse,
  SignOutResponse,
  SignUpResponse,
} from "@/features/auth/auth-types";
import type {
  RequestEmailVerificationInput,
  RequestPasswordResetInput,
  SignUpActionInput,
} from "@/features/auth/auth-action-types";
import {
  confirmEmailChangeAction,
  requestEmailVerificationAction,
  requestPasswordResetAction,
  resetPasswordAction,
  signInAction,
  signOutAction,
  signUpAction,
} from "@/features/auth/auth-actions";
import {
  broadcastSessionChanged,
  broadcastSignedOut,
  ensureSessionSyncInitialized,
} from "@/features/auth/auth-client-sync";
import {
  getSessionSnapshot,
  isSessionIdle,
  refreshSession,
  setSessionState,
  subscribeToSessionStore,
} from "@/features/auth/auth-client-store";
import type { SignInInput } from "@/features/auth/auth-schemas";
import { runAsyncTransition } from "@/lib/app-utils";

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
  return useSyncExternalStore(subscribeToAuthSessionStore, getSessionSnapshot, getSessionSnapshot);
}

export { refreshSession };

function subscribeToAuthSessionStore(listener: () => void) {
  const unsubscribe = subscribeToSessionStore(listener);

  ensureSessionSyncInitialized();

  if (isSessionIdle()) {
    void refreshSession();
  }

  return unsubscribe;
}
