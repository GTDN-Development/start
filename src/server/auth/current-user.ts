import type PocketBase from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import {
  createClearedAuthAndDeviceCookies,
  readDeviceSessionCookie,
} from "@/server/device-sessions/device-sessions-cookie";
import { validateDeviceSessionOrInvalidate } from "@/server/device-sessions/device-sessions-service";
import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import { isUsersRecord, logServiceError } from "@/server/pocketbase/pocketbase-utils";

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
      setCookie?: string[];
    };

export async function requireCurrentUser(): Promise<RequireCurrentUserResult> {
  const { pb, hasAuthCookie, hadInvalidAuthCookie } = await createPocketBaseServerClient();

  if (hadInvalidAuthCookie) {
    return createUnauthorizedResult(createClearedAuthAndDeviceCookies());
  }

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return createUnauthorizedResult(hasAuthCookie ? createClearedAuthAndDeviceCookies() : undefined);
  }

  if (!isUsersRecord(pb.authStore.record)) {
    return createUnauthorizedResult(createClearedAuthAndDeviceCookies());
  }

  try {
    const deviceSessionToken = await readDeviceSessionCookie();
    const deviceSessionCheck = await validateDeviceSessionOrInvalidate({
      pb,
      userId: pb.authStore.record.id,
      deviceSessionToken,
      shouldUpdateHeartbeat: true,
    });

    if (deviceSessionCheck.status === "invalid") {
      return createUnauthorizedResult(deviceSessionCheck.clearCookies);
    }

    return {
      ok: true,
      pb,
      user: pb.authStore.record,
      currentSessionIdHash: deviceSessionCheck.sessionIdHash,
    };
  } catch (error) {
    logServiceError("auth-current-user", "requireCurrentUser.deviceValidation", error);

    return {
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    };
  }
}

function createUnauthorizedResult(setCookie?: string[]): RequireCurrentUserResult {
  return {
    ok: false,
    errorCode: "UNAUTHORIZED",
    ...(setCookie ? { setCookie } : {}),
  };
}
