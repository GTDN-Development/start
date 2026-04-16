"use client";

import type {
  ConfirmEmailChangeResponse,
  ResetPasswordResponse,
  SignInResponse,
  SignOutResponse,
} from "@/features/auth/auth-types";
import {
  confirmEmailChangeAction,
  resetPasswordAction,
  signInAction,
  signOutAction,
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
