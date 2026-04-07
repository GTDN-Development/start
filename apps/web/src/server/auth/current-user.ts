import PocketBase, { ClientResponseError } from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import {
  createClearedAuthAndDeviceCookies,
  readDeviceSessionCookie,
} from "@/server/device-sessions/device-sessions-cookie";
import {
  checkDeviceSessionReadOnly,
  validateDeviceSessionOrInvalidate,
} from "@/server/device-sessions/device-sessions-service";
import { isTransientError } from "@/server/auth/auth-errors";
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
    };

export type RequireCurrentActionUserResult =
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
  const { pb, hadInvalidAuthCookie } = await createPocketBaseServerClient();

  if (hadInvalidAuthCookie) {
    return createReadOnlyUnauthorizedResult();
  }

  const authenticatedUser = getAuthenticatedUserFromStore(pb);

  if (!authenticatedUser) {
    return createReadOnlyUnauthorizedResult();
  }

  try {
    const deviceSessionToken = await readDeviceSessionCookie();
    const deviceSessionCheck = await checkDeviceSessionReadOnly({
      pb,
      userId: authenticatedUser.id,
      deviceSessionToken,
    });

    if (deviceSessionCheck.status === "invalid") {
      return createReadOnlyUnauthorizedResult();
    }

    const user = await getVerifiedUserRecordReadOnly(pb, authenticatedUser);

    if (!user) {
      return createReadOnlyUnauthorizedResult();
    }

    return {
      ok: true,
      pb,
      user,
      currentSessionIdHash: deviceSessionCheck.sessionIdHash,
    };
  } catch (error) {
    logServiceError("auth-current-user", "requireCurrentUser.readOnly", error);

    return {
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    };
  }
}

export async function requireCurrentActionUser(): Promise<RequireCurrentActionUserResult> {
  const { pb, hasAuthCookie, hadInvalidAuthCookie } = await createPocketBaseServerClient();

  if (hadInvalidAuthCookie) {
    return createActionUnauthorizedResult(createClearedAuthAndDeviceCookies());
  }

  const authenticatedUser = getAuthenticatedUserFromStore(pb);

  if (!authenticatedUser) {
    return createActionUnauthorizedResult(
      hasAuthCookie ? createClearedAuthAndDeviceCookies() : undefined
    );
  }

  try {
    const deviceSessionToken = await readDeviceSessionCookie();
    const deviceSessionCheck = await validateDeviceSessionOrInvalidate({
      pb,
      userId: authenticatedUser.id,
      deviceSessionToken,
      shouldUpdateHeartbeat: true,
    });

    if (deviceSessionCheck.status === "invalid") {
      return createActionUnauthorizedResult(deviceSessionCheck.clearCookies);
    }

    const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();

    if (!isUsersRecord(refreshedAuth.record)) {
      return createActionUnauthorizedResult(createClearedAuthAndDeviceCookies());
    }

    if (refreshedAuth.record.verified !== true) {
      console.warn("[auth-current-user] requireCurrentActionUser.unverifiedUserSession");

      return createActionUnauthorizedResult(createClearedAuthAndDeviceCookies());
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
        "[auth-current-user] requireCurrentActionUser.authRefreshUnauthorized",
        formatServiceError(error)
      );

      return createActionUnauthorizedResult(createClearedAuthAndDeviceCookies());
    }

    logServiceError("auth-current-user", "requireCurrentActionUser", error);

    return {
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    };
  }
}

function getAuthenticatedUserFromStore(pb: PocketBase): UsersRecord | null {
  if (!pb.authStore.isValid || !isUsersRecord(pb.authStore.record)) {
    return null;
  }

  return pb.authStore.record;
}

async function getVerifiedUserRecordReadOnly(
  pb: PocketBase,
  authenticatedUser: UsersRecord
): Promise<UsersRecord | null> {
  try {
    const user = await pb.collection("users").getOne<UsersRecord>(authenticatedUser.id);

    if (!isUsersRecord(user) || user.verified !== true) {
      return null;
    }

    return user;
  } catch (error) {
    if (isAuthRefreshUnauthorizedError(error)) {
      return null;
    }

    if (isTransientError(error) && authenticatedUser.verified === true) {
      console.warn("[auth-current-user] requireCurrentUser.transientBackendError");
      return authenticatedUser;
    }

    throw error;
  }
}

function createReadOnlyUnauthorizedResult(): RequireCurrentUserResult {
  return {
    ok: false,
    errorCode: "UNAUTHORIZED",
  };
}

function createActionUnauthorizedResult(setCookie?: string[]): RequireCurrentActionUserResult {
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
