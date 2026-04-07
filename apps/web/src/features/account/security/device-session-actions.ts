"use server";

import { z } from "zod";
import type { AuthResponse } from "@/features/auth/auth-types";
import { requireCurrentActionUser } from "@/server/auth/current-user";
import { finalizeAuthAction } from "@/server/auth/auth-response";
import {
  revokeDeviceSessionById,
  revokeOtherDeviceSessions,
} from "@/server/device-sessions/device-sessions-service";
import { logServiceError } from "@/server/pocketbase/pocketbase-utils";

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
  const currentUser = await requireCurrentActionUser();

  if (!currentUser.ok) {
    return finalizeAuthAction({
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.setCookie ? { setCookie: currentUser.setCookie } : {}),
    });
  }

  try {
    await revokeOtherDeviceSessions({
      pb: currentUser.pb,
      userId: currentUser.user.id,
      currentSessionIdHash: currentUser.currentSessionIdHash,
    });

    return finalizeAuthAction({
      ok: true,
      data: {
        revoked: true,
      },
    });
  } catch (error) {
    logServiceError("account-device-session-actions", "signOutOtherDevicesAction", error);

    return finalizeAuthAction({
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    });
  }
}

export async function signOutDeviceAction(input: {
  deviceSessionId: string;
}): Promise<AuthResponse<SignOutDevicePayload>> {
  const parsedInput = signOutDeviceInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse();
  }

  const currentUser = await requireCurrentActionUser();

  if (!currentUser.ok) {
    return finalizeAuthAction({
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.setCookie ? { setCookie: currentUser.setCookie } : {}),
    });
  }

  try {
    const revokeResult = await revokeDeviceSessionById({
      pb: currentUser.pb,
      userId: currentUser.user.id,
      deviceSessionId: parsedInput.data.deviceSessionId,
      currentSessionIdHash: currentUser.currentSessionIdHash,
    });

    if (revokeResult === "not_found") {
      return finalizeAuthAction({
        ok: false,
        errorCode: "NOT_FOUND",
      });
    }

    if (revokeResult === "current_device") {
      return createBadRequestResponse();
    }

    return finalizeAuthAction({
      ok: true,
      data: {
        revoked: true,
      },
    });
  } catch (error) {
    logServiceError("account-device-session-actions", "signOutDeviceAction", error);

    return finalizeAuthAction({
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    });
  }
}

function createBadRequestResponse<TData>(): AuthResponse<TData> {
  return {
    ok: false,
    errorCode: "BAD_REQUEST",
  };
}
