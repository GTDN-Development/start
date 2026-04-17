"use server";

import { headers } from "next/headers";
import { z } from "zod";
import type {
  AuthResponse,
  AuthSessionPayload,
  AuthSignOutPayload,
  ConfirmEmailChangePayload,
  RequestEmailVerificationPayload,
  RequestPasswordResetPayload,
  ResetPasswordPayload,
  SignUpPayload,
} from "@/features/auth/auth-types";
import type {
  RequestEmailVerificationInput,
  RequestPasswordResetInput,
  SignUpActionInput,
} from "@/features/auth/auth-action-types";
import {
  signInInputSchema,
  signUpInputSchema,
  type SignInInput,
} from "@/features/auth/auth-schemas";
import {
  authPasswordSchema,
  normalizedEmailSchema,
  refinePasswordMatch,
  requiredPasswordSchema,
  requiredTokenSchema,
  turnstileTokenSchema,
} from "@/lib/schemas";
import { isTurnstileEnabled } from "@/config/security";
import { getClientIPFromHeaders, verifyTurnstileToken } from "@/server/captcha/turnstile";
import {
  confirmEmailChangeToken,
  requestEmailVerificationForEmail,
} from "@/server/auth/auth-email-verification-service";
import { clearSessionScopedApplicationState } from "@/server/application/application-session-state";
import {
  createAuthErrorResponse,
  createBadRequestAuthResponse,
  finalizeAuthAction,
} from "@/server/auth/auth-response";
import { signInWithPassword, signOutServerSession } from "@/server/auth/auth-session-service";
import { signUpWithPassword } from "@/server/auth/auth-sign-up-service";
import {
  confirmPasswordResetToken,
  requestPasswordResetForEmail,
} from "@/server/auth/auth-password-reset-service";

const turnstileEnabled = isTurnstileEnabled();

const signUpActionInputSchema = signUpInputSchema.extend({
  turnstileToken: turnstileTokenSchema({
    enabled: turnstileEnabled,
  }),
});

const requestPasswordResetInputSchema = z.object({
  email: normalizedEmailSchema(),
  turnstileToken: turnstileTokenSchema({
    enabled: turnstileEnabled,
  }),
});

const requestEmailVerificationInputSchema = z.object({
  email: normalizedEmailSchema(),
});

const resetPasswordInputSchema = z
  .object({
    token: requiredTokenSchema(),
    password: authPasswordSchema(),
    confirmPassword: authPasswordSchema(),
  })
  .superRefine(refinePasswordMatch());

const confirmEmailChangeInputSchema = z.object({
  token: requiredTokenSchema(),
  password: requiredPasswordSchema(),
});

export async function signInAction(input: SignInInput): Promise<AuthResponse<AuthSessionPayload>> {
  const parsedInput = signInInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestAuthResponse<AuthSessionPayload>();
  }

  const response = await signInWithPassword(parsedInput.data);

  return finalizeAuthAction(response);
}

export async function signUpAction(input: SignUpActionInput): Promise<AuthResponse<SignUpPayload>> {
  const parsedInput = signUpActionInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestAuthResponse<SignUpPayload>();
  }

  const turnstileFailureResponse = await verifyTurnstileGate<SignUpPayload>(
    parsedInput.data.turnstileToken
  );

  if (turnstileFailureResponse) {
    return turnstileFailureResponse;
  }

  const { turnstileToken: _turnstileToken, ...signUpInput } = parsedInput.data;
  const response = await signUpWithPassword(signUpInput);

  return finalizeAuthAction(response);
}

export async function signOutAction(): Promise<AuthResponse<AuthSignOutPayload>> {
  const response = await signOutServerSession();

  if (response.ok) {
    await clearSessionScopedApplicationState();
  }

  return finalizeAuthAction(response);
}

export async function requestPasswordResetAction(
  input: RequestPasswordResetInput
): Promise<AuthResponse<RequestPasswordResetPayload>> {
  const parsedInput = requestPasswordResetInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestAuthResponse<RequestPasswordResetPayload>();
  }

  const turnstileFailureResponse = await verifyTurnstileGate<RequestPasswordResetPayload>(
    parsedInput.data.turnstileToken
  );

  if (turnstileFailureResponse) {
    return turnstileFailureResponse;
  }

  const response = await requestPasswordResetForEmail(parsedInput.data.email);

  return finalizeAuthAction(response);
}

export async function resetPasswordAction(input: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<AuthResponse<ResetPasswordPayload>> {
  const parsedInput = resetPasswordInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestAuthResponse<ResetPasswordPayload>();
  }

  const response = await confirmPasswordResetToken({
    token: parsedInput.data.token,
    password: parsedInput.data.password,
    confirmPassword: parsedInput.data.confirmPassword,
  });

  return finalizeAuthAction(response);
}

export async function requestEmailVerificationAction(
  input: RequestEmailVerificationInput
): Promise<AuthResponse<RequestEmailVerificationPayload>> {
  const parsedInput = requestEmailVerificationInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestAuthResponse<RequestEmailVerificationPayload>();
  }

  const response = await requestEmailVerificationForEmail(parsedInput.data.email);

  return finalizeAuthAction(response);
}

export async function confirmEmailChangeAction(input: {
  token: string;
  password: string;
}): Promise<AuthResponse<ConfirmEmailChangePayload>> {
  const parsedInput = confirmEmailChangeInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestAuthResponse<ConfirmEmailChangePayload>();
  }

  const response = await confirmEmailChangeToken(parsedInput.data);

  return finalizeAuthAction(response);
}

async function verifyTurnstileGate<TData>(
  turnstileToken: string
): Promise<AuthResponse<TData> | null> {
  const requestHeaders = await headers();
  const clientIP = getClientIPFromHeaders(requestHeaders);
  const turnstileVerification = await verifyTurnstileToken(turnstileToken, clientIP);

  if (turnstileVerification.success) {
    return null;
  }

  return createAuthErrorResponse<TData>("TURNSTILE_VERIFICATION_FAILED");
}
