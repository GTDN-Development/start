"use server";

import { z } from "zod";
import type {
  AuthResponse,
  AuthSessionPayload,
  AuthSignOutPayload,
  ConfirmEmailChangePayload,
  RequestEmailVerificationPayload,
  RequestPasswordResetPayload,
  ResetPasswordPayload,
  VerifyEmailPayload,
} from "@/features/auth/auth-contract";
import {
  createAuthPasswordSchema,
  signInInputSchema,
  signUpInputSchema,
  type SignInInput,
  type SignUpInput,
} from "@/features/auth/auth-schemas";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import {
  confirmEmailChangeToken,
  confirmEmailVerificationToken,
  confirmPasswordResetToken,
  requestEmailVerificationForCurrentUser,
  requestPasswordResetForEmail,
  signInWithPassword,
  signOutServerSession,
  signUpWithPassword,
  toAuthApiResponse,
  type ServerAuthResponse,
} from "@/server/auth/auth-service";

const verifyEmailInputSchema = z.object({
  token: z.string().trim().min(1),
});

const requestPasswordResetInputSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

const resetPasswordInputSchema = z
  .object({
    token: z.string().trim().min(1),
    password: createAuthPasswordSchema(),
    confirmPassword: createAuthPasswordSchema(),
  })
  .superRefine((values, context) => {
    if (values.password !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
      });
    }
  });

const confirmEmailChangeInputSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function signInAction(input: SignInInput): Promise<AuthResponse<AuthSessionPayload>> {
  const parsedInput = signInInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<AuthSessionPayload>();
  }

  const response = await signInWithPassword(parsedInput.data);

  return finalizeAuthAction(response);
}

export async function signUpAction(input: SignUpInput): Promise<AuthResponse<AuthSessionPayload>> {
  const parsedInput = signUpInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<AuthSessionPayload>();
  }

  const response = await signUpWithPassword(parsedInput.data);

  return finalizeAuthAction(response);
}

export async function signOutAction(): Promise<AuthResponse<AuthSignOutPayload>> {
  const response = await signOutServerSession();

  return finalizeAuthAction(response);
}

export async function verifyEmailAction(input: {
  token: string;
}): Promise<AuthResponse<VerifyEmailPayload>> {
  const parsedInput = verifyEmailInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<VerifyEmailPayload>();
  }

  const response = await confirmEmailVerificationToken(parsedInput.data.token);

  return finalizeAuthAction(response);
}

export async function requestPasswordResetAction(input: {
  email: string;
}): Promise<AuthResponse<RequestPasswordResetPayload>> {
  const parsedInput = requestPasswordResetInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<RequestPasswordResetPayload>();
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

export async function requestEmailVerificationAction(): Promise<
  AuthResponse<RequestEmailVerificationPayload>
> {
  const response = await requestEmailVerificationForCurrentUser();

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

async function finalizeAuthAction<TData>(
  response: ServerAuthResponse<TData>
): Promise<AuthResponse<TData>> {
  await applyServerAuthCookies(response.setCookie);

  return toAuthApiResponse(response);
}

function createBadRequestResponse<TData>(): AuthResponse<TData> {
  return {
    ok: false,
    errorCode: "BAD_REQUEST",
  };
}
