"use server";

import { z } from "zod";
import type { AuthResponse } from "@/features/auth/auth-types";
import {
  revokeCurrentUserDeviceSessionById,
  revokeCurrentUserOtherDeviceSessions,
} from "@/server/auth/current-user";
import { createBadRequestAuthResponse, finalizeAuthAction } from "@/server/auth/auth-response";

const signOutDeviceInputSchema = z.object({
  deviceSessionId: z.string().trim().min(1),
});

type SignOutOtherDevicesPayload = {
  revoked: true;
};

type SignOutDevicePayload = {
  revoked: true;
};

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
