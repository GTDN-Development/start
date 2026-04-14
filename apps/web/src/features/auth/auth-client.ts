"use client";

import type {
  ConfirmEmailChangeResponse,
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
import { emitAuthChanged, emitSignedOut } from "@/features/auth/auth-client-events";
import type { SignInInput } from "@/features/auth/auth-schemas";
import { runAsyncTransition } from "@/lib/app-utils";

export async function signIn(input: SignInInput): Promise<SignInResponse> {
  const response = await runAsyncTransition(() => signInAction(input));

  if (response.ok) {
    emitAuthChanged();
  }

  return response;
}

export async function signUp(input: SignUpActionInput): Promise<SignUpResponse> {
  return await runAsyncTransition(() => signUpAction(input));
}

export async function signOut(): Promise<SignOutResponse> {
  const response = await runAsyncTransition(() => signOutAction());

  if (response.ok) {
    emitSignedOut();
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
    emitSignedOut();
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
    emitSignedOut();
  }

  return response;
}
