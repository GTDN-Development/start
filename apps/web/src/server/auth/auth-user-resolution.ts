import PocketBase, { ClientResponseError } from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import { isTransientError } from "@/server/auth/auth-errors";
import { resolveCurrentAuthDeviceSession } from "@/server/auth/auth-device-session-integration";
import { createClearedAuthAndDeviceCookies } from "@/server/device-sessions/device-sessions-cookie";
import {
  createPocketBaseServerClient,
  exportPocketBaseAuthCookies,
} from "@/server/pocketbase/pocketbase-server";
import { isUsersRecord, logServiceError } from "@/server/pocketbase/pocketbase-utils";

type AuthResolutionErrorCode = "UNAUTHORIZED" | "UNKNOWN_ERROR";

type RefreshedAuthRecordResult =
  | {
      status: "verified";
      user: UsersRecord;
    }
  | {
      status: "unverified";
    }
  | {
      status: "unauthorized";
    };

export type ResolvedRenderAuthenticatedUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
      currentSessionIdHash: string;
    }
  | {
      ok: false;
      errorCode: AuthResolutionErrorCode;
    };

export type ResolvedWritableAuthenticatedUserResult =
  | {
      status: "authenticated";
      pb: PocketBase;
      user: UsersRecord;
      currentSessionIdHash: string;
      setCookie?: string[];
    }
  | {
      status: "unverified";
      setCookie: string[];
    }
  | {
      status: "unauthorized";
      setCookie?: string[];
    }
  | {
      status: "unknown_error";
      setCookie?: string[];
      staleUser?: UsersRecord;
      pb?: PocketBase;
    };

export async function resolveRenderAuthenticatedUser(): Promise<ResolvedRenderAuthenticatedUserResult> {
  const { pb, hadInvalidAuthCookie } = await createPocketBaseServerClient();

  if (hadInvalidAuthCookie) {
    return createRenderAuthFailure("UNAUTHORIZED");
  }

  const authenticatedUser = getAuthenticatedUserFromStore(pb);

  if (!authenticatedUser) {
    return createRenderAuthFailure("UNAUTHORIZED");
  }

  try {
    const deviceSessionCheck = await resolveCurrentAuthDeviceSession({
      pb,
      userId: authenticatedUser.id,
      mode: "read",
    });

    if (deviceSessionCheck.status === "invalid") {
      return createRenderAuthFailure("UNAUTHORIZED");
    }

    const user = await getVerifiedUserRecordReadOnly(pb, authenticatedUser);

    if (!user) {
      return createRenderAuthFailure("UNAUTHORIZED");
    }

    return {
      ok: true,
      pb,
      user,
      currentSessionIdHash: deviceSessionCheck.sessionIdHash,
    };
  } catch (error) {
    logServiceError("auth-user-resolution", "resolveRenderAuthenticatedUser", error);

    return createRenderAuthFailure("UNKNOWN_ERROR");
  }
}

export async function resolveWritableAuthenticatedUser(): Promise<ResolvedWritableAuthenticatedUserResult> {
  const { pb, hasAuthCookie, hadInvalidAuthCookie, shouldPersistSession } =
    await createPocketBaseServerClient();

  if (hadInvalidAuthCookie) {
    return createWritableUnauthorizedResolution(createClearedAuthAndDeviceCookies());
  }

  const authenticatedUser = getAuthenticatedUserFromStore(pb);

  if (!authenticatedUser) {
    return createWritableUnauthorizedResolution(
      hasAuthCookie ? createClearedAuthAndDeviceCookies() : undefined
    );
  }

  try {
    const deviceSessionCheck = await resolveCurrentAuthDeviceSession({
      pb,
      userId: authenticatedUser.id,
      mode: "write",
      shouldPersistSession,
    });

    if (deviceSessionCheck.status === "invalid") {
      return createWritableUnauthorizedResolution(deviceSessionCheck.setCookie);
    }

    const refreshedAuth = await refreshCurrentAuthRecord(pb);

    if (refreshedAuth.status === "verified") {
      return {
        status: "authenticated",
        pb,
        user: refreshedAuth.user,
        currentSessionIdHash: deviceSessionCheck.sessionIdHash,
        setCookie: exportPocketBaseAuthCookies(pb, {
          sessionOnly: !shouldPersistSession,
        }),
      };
    }

    if (refreshedAuth.status === "unverified") {
      return {
        status: "unverified",
        setCookie: exportPocketBaseAuthCookies(pb, {
          sessionOnly: !shouldPersistSession,
        }),
      };
    }

    return createWritableUnauthorizedResolution(createClearedAuthAndDeviceCookies());
  } catch (error) {
    if (isTransientError(error) && authenticatedUser.verified === true) {
      console.warn("[auth-user-resolution] resolveWritableAuthenticatedUser stale session");

      return {
        status: "unknown_error",
        pb,
        staleUser: authenticatedUser,
      };
    }

    logServiceError("auth-user-resolution", "resolveWritableAuthenticatedUser", error);

    return {
      status: "unknown_error",
      setCookie: createClearedAuthAndDeviceCookies(),
    };
  }
}

export function getAuthenticatedUserFromStore(pb: PocketBase): UsersRecord | null {
  if (!pb.authStore.isValid || !isUsersRecord(pb.authStore.record)) {
    return null;
  }

  return pb.authStore.record;
}

export async function getVerifiedUserRecordReadOnly(
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
      console.warn("[auth-user-resolution] getVerifiedUserRecordReadOnly.transientBackendError");
      return authenticatedUser;
    }

    throw error;
  }
}

export async function refreshCurrentAuthRecord(pb: PocketBase): Promise<RefreshedAuthRecordResult> {
  try {
    const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();

    if (!isUsersRecord(refreshedAuth.record)) {
      return {
        status: "unauthorized",
      };
    }

    if (refreshedAuth.record.verified !== true) {
      return {
        status: "unverified",
      };
    }

    return {
      status: "verified",
      user: refreshedAuth.record,
    };
  } catch (error) {
    if (isAuthRefreshUnauthorizedError(error)) {
      return {
        status: "unauthorized",
      };
    }

    throw error;
  }
}

function createRenderAuthFailure(
  errorCode: AuthResolutionErrorCode
): ResolvedRenderAuthenticatedUserResult {
  return {
    ok: false,
    errorCode,
  };
}

function createWritableUnauthorizedResolution(
  setCookie?: string[]
): ResolvedWritableAuthenticatedUserResult {
  return {
    status: "unauthorized",
    ...(setCookie ? { setCookie } : {}),
  };
}

function isAuthRefreshUnauthorizedError(error: unknown) {
  return (
    error instanceof ClientResponseError &&
    (error.status === 400 || error.status === 401 || error.status === 403 || error.status === 404)
  );
}
