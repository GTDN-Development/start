import type PocketBase from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import type { ServerAuthResponse } from "@/server/auth/auth-response";
import { resolveCurrentServerAuth } from "@/server/auth/auth-user-resolution";
import type { DeviceSessionListItem } from "@/server/device-sessions/device-sessions-types";
import {
  listDeviceSessions,
  revokeDeviceSessionById,
  revokeOtherDeviceSessions,
} from "@/server/device-sessions/device-sessions-service";
import { logServiceError } from "@/server/pocketbase/pocketbase-utils";

type RequireCurrentUserErrorCode = "UNAUTHORIZED" | "UNKNOWN_ERROR";

export type RequireCurrentUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
      currentSessionIdHash: string;
    }
  | {
      ok: false;
      errorCode: RequireCurrentUserErrorCode;
    };

export type RequireCurrentWritableUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
      currentSessionIdHash: string;
    }
  | {
      ok: false;
      errorCode: RequireCurrentUserErrorCode;
      setCookie?: string[];
    };

export async function requireCurrentUser(): Promise<RequireCurrentUserResult> {
  const currentUser = await resolveCurrentServerAuth({
    mode: "read",
  });

  if (currentUser.status !== "authenticated") {
    return {
      ok: false,
      errorCode: currentUser.status === "unknown_error" ? "UNKNOWN_ERROR" : "UNAUTHORIZED",
    };
  }

  return {
    ok: true,
    pb: currentUser.pb,
    user: currentUser.user,
    currentSessionIdHash: currentUser.currentSessionIdHash,
  };
}

export async function listCurrentUserDeviceSessions(): Promise<DeviceSessionListItem[]> {
  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    return [];
  }

  try {
    return await listDeviceSessions({
      pb: currentUser.pb,
      userId: currentUser.user.id,
      currentSessionIdHash: currentUser.currentSessionIdHash,
    });
  } catch (error) {
    logServiceError("current-user", "listCurrentUserDeviceSessions", error);

    return [];
  }
}

export async function revokeCurrentUserOtherDeviceSessions(): Promise<
  ServerAuthResponse<{ revoked: true }>
> {
  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return currentUser;
  }

  try {
    await revokeOtherDeviceSessions({
      pb: currentUser.pb,
      userId: currentUser.user.id,
      currentSessionIdHash: currentUser.currentSessionIdHash,
    });

    return {
      ok: true,
      data: {
        revoked: true,
      },
    };
  } catch (error) {
    logServiceError("current-user", "revokeCurrentUserOtherDeviceSessions", error);

    return {
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    };
  }
}

export async function revokeCurrentUserDeviceSessionById(input: {
  deviceSessionId: string;
}): Promise<ServerAuthResponse<{ revoked: true }>> {
  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return currentUser;
  }

  try {
    const revokeResult = await revokeDeviceSessionById({
      pb: currentUser.pb,
      userId: currentUser.user.id,
      deviceSessionId: input.deviceSessionId,
      currentSessionIdHash: currentUser.currentSessionIdHash,
    });

    if (revokeResult === "not_found") {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (revokeResult === "current_device") {
      return {
        ok: false,
        errorCode: "BAD_REQUEST",
      };
    }

    return {
      ok: true,
      data: {
        revoked: true,
      },
    };
  } catch (error) {
    logServiceError("current-user", "revokeCurrentUserDeviceSessionById", error);

    return {
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    };
  }
}

export async function requireCurrentWritableUser(): Promise<RequireCurrentWritableUserResult> {
  const currentUser = await resolveCurrentServerAuth({
    mode: "write",
  });
  const isStaleAuthenticatedUser =
    currentUser.status === "authenticated" && currentUser.isStale === true;

  if (currentUser.status !== "authenticated" || isStaleAuthenticatedUser) {
    return {
      ok: false,
      errorCode:
        currentUser.status === "unknown_error" || isStaleAuthenticatedUser
          ? "UNKNOWN_ERROR"
          : "UNAUTHORIZED",
      ...(currentUser.setCookie ? { setCookie: currentUser.setCookie } : {}),
    };
  }

  return {
    ok: true,
    pb: currentUser.pb,
    user: currentUser.user,
    currentSessionIdHash: currentUser.currentSessionIdHash,
  };
}
