"use server";

import { z } from "zod";
import {
  accountDeleteInputSchema,
  accountPasswordUpdateInputSchema,
} from "@/features/account/account-schemas";
import type { AuthResponse } from "@/features/auth/auth-types";
import {
  deleteCurrentUserAccountWithPassword,
  updateCurrentUserPassword,
} from "@/server/account/account-security-service";
import { clearSessionScopedApplicationState } from "@/server/application/application-session-state";
import { createBadRequestAuthResponse, finalizeAuthAction } from "@/server/auth/auth-response";
import {
  revokeCurrentUserDeviceSessionById,
  revokeCurrentUserOtherDeviceSessions,
} from "@/server/auth/current-user";

type DeleteAccountPayload = {
  deleted: true;
};

type SignOutOtherDevicesPayload = {
  revoked: true;
};

type SignOutDevicePayload = {
  revoked: true;
};

type UpdateAccountPasswordPayload = {
  passwordUpdated: true;
};

const signOutDeviceInputSchema = z.object({
  deviceSessionId: z.string().trim().min(1),
});

export async function signOutOtherDevicesAction(): Promise<
  AuthResponse<SignOutOtherDevicesPayload>
> {
  const response = await revokeCurrentUserOtherDeviceSessions();

  return finalizeAuthAction(response);
}

export async function signOutDeviceAction(input: {
  deviceSessionId: string;
}): Promise<AuthResponse<SignOutDevicePayload>> {
  const parsedInput = signOutDeviceInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestAuthResponse();
  }

  const response = await revokeCurrentUserDeviceSessionById(parsedInput.data);

  return finalizeAuthAction(response);
}

export async function updateAccountPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthResponse<UpdateAccountPasswordPayload>> {
  const parsedInput = accountPasswordUpdateInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestAuthResponse<UpdateAccountPasswordPayload>();
  }

  const response = await updateCurrentUserPassword(parsedInput.data);

  return finalizeAuthAction(response);
}

export async function deleteAccountAction(input: {
  password: string;
}): Promise<AuthResponse<DeleteAccountPayload>> {
  const parsedInput = accountDeleteInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestAuthResponse<DeleteAccountPayload>();
  }

  const response = await deleteCurrentUserAccountWithPassword(parsedInput.data.password);

  if (response.ok) {
    await clearSessionScopedApplicationState();
  }

  return finalizeAuthAction(response);
}
