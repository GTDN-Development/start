"use server";

import { headers } from "next/headers";
import { z } from "zod";
import type {
  AuthResponse,
  AuthSessionPayload,
  AuthSignOutPayload,
  ConfirmEmailChangePayload,
  RequestEmailVerificationInput,
  SignUpPayload,
  RequestPasswordResetInput,
  RequestEmailVerificationPayload,
  RequestPasswordResetPayload,
  ResetPasswordPayload,
  SignUpActionInput,
} from "@/features/auth/auth-contract";
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
import { finalizeAuthAction } from "@/server/auth/auth-service-shared";
import {
  getServerAuthSession,
  signInWithPassword,
  signOutServerSession,
} from "@/server/auth/auth-session-service";
import { signUpWithPassword } from "@/server/auth/auth-sign-up-service";
import {
  confirmPasswordResetToken,
  requestPasswordResetForEmail,
} from "@/server/auth/auth-password-reset-service";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import { resolvePostAuthDestination } from "@/server/workspaces/workspace-resolution-service";
import { setActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";

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

export type PostAuthDestinationActionResult =
  | {
      state: "app";
    }
  | {
      state: "workspace_redirect";
      workspaceSlug: string;
    }
  | {
      state: "invite_redirect";
      inviteToken: string;
    };

export async function signInAction(input: SignInInput): Promise<AuthResponse<AuthSessionPayload>> {
  const parsedInput = signInInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<AuthSessionPayload>();
  }

  const response = await signInWithPassword(parsedInput.data);

  return finalizeAuthAction(response);
}

export async function signUpAction(input: SignUpActionInput): Promise<AuthResponse<SignUpPayload>> {
  const parsedInput = signUpActionInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<SignUpPayload>();
  }

  const turnstileVerification = await verifyAuthTurnstileToken(parsedInput.data.turnstileToken);

  if (!turnstileVerification.success) {
    return createTurnstileVerificationFailedResponse<SignUpPayload>();
  }

  const { turnstileToken: _turnstileToken, ...signUpInput } = parsedInput.data;
  const response = await signUpWithPassword(signUpInput);

  return finalizeAuthAction(response);
}

export async function signOutAction(): Promise<AuthResponse<AuthSignOutPayload>> {
  const response = await signOutServerSession();

  return finalizeAuthAction(response);
}

export async function resolvePostAuthDestinationAction(): Promise<
  AuthResponse<PostAuthDestinationActionResult>
> {
  const sessionResponse = await getServerAuthSession();

  if (!sessionResponse.ok || !sessionResponse.data.session) {
    await applyServerAuthCookies(sessionResponse.setCookie);

    return {
      ok: false,
      errorCode: "UNAUTHORIZED",
    };
  }

  const session = sessionResponse.data.session;
  const response = await resolvePostAuthDestination({
    userId: session.user.id,
    userEmail: session.user.email,
  });

  await applyServerAuthCookies(response.setCookie);

  if (!response.ok) {
    return {
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    };
  }

  if (response.data.state === "workspace_redirect") {
    await setActiveWorkspaceSlugCookie(response.data.workspaceSlug);
  }

  return {
    ok: true,
    data: response.data,
  };
}

export async function requestPasswordResetAction(
  input: RequestPasswordResetInput
): Promise<AuthResponse<RequestPasswordResetPayload>> {
  const parsedInput = requestPasswordResetInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<RequestPasswordResetPayload>();
  }

  const turnstileVerification = await verifyAuthTurnstileToken(parsedInput.data.turnstileToken);

  if (!turnstileVerification.success) {
    return createTurnstileVerificationFailedResponse<RequestPasswordResetPayload>();
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
    return createBadRequestResponse<ResetPasswordPayload>();
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
    return createBadRequestResponse<RequestEmailVerificationPayload>();
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
    return createBadRequestResponse<ConfirmEmailChangePayload>();
  }

  const response = await confirmEmailChangeToken(parsedInput.data);

  return finalizeAuthAction(response);
}

async function verifyAuthTurnstileToken(turnstileToken: string) {
  const requestHeaders = await headers();
  const clientIP = getClientIPFromHeaders(requestHeaders);

  return verifyTurnstileToken(turnstileToken, clientIP);
}

function createBadRequestResponse<TData>(): AuthResponse<TData> {
  return {
    ok: false,
    errorCode: "BAD_REQUEST",
  };
}

function createTurnstileVerificationFailedResponse<TData>(): AuthResponse<TData> {
  return {
    ok: false,
    errorCode: "TURNSTILE_VERIFICATION_FAILED",
  };
}
