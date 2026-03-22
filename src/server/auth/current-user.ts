import PocketBase, { ClientResponseError } from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import {
  createClearedAuthAndDeviceCookies,
  readDeviceSessionCookie,
} from "@/server/device-sessions/device-sessions-cookie";
import { validateDeviceSessionOrInvalidate } from "@/server/device-sessions/device-sessions-service";
import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import {
  formatServiceError,
  isUsersRecord,
  logServiceError,
} from "@/server/pocketbase/pocketbase-utils";

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
    return createUnauthorizedResult(
      hasAuthCookie ? createClearedAuthAndDeviceCookies() : undefined
    );
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

    const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();

    if (!isUsersRecord(refreshedAuth.record)) {
      return createUnauthorizedResult(createClearedAuthAndDeviceCookies());
    }

    return {
      ok: true,
      pb,
      user: refreshedAuth.record,
      currentSessionIdHash: deviceSessionCheck.sessionIdHash,
    };
  } catch (error) {
    if (isAuthRefreshUnauthorizedError(error)) {
      console.warn(
        "[auth-current-user] requireCurrentUser.authRefreshUnauthorized",
        formatServiceError(error)
      );

      return createUnauthorizedResult(createClearedAuthAndDeviceCookies());
    }

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

function isAuthRefreshUnauthorizedError(error: unknown) {
  return (
    error instanceof ClientResponseError &&
    (error.status === 400 || error.status === 401 || error.status === 403 || error.status === 404)
  );
}
