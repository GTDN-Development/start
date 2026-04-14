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

type AuthResolutionMode = "render" | "action" | "response";
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

export type ResolvedAuthenticatedUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
      currentSessionIdHash: string;
      setCookie?: string[];
    }
  | {
      ok: false;
      errorCode: AuthResolutionErrorCode;
      setCookie?: string[];
      staleUser?: UsersRecord;
      pb?: PocketBase;
    };

export async function resolveAuthenticatedUser(input: {
  mode: AuthResolutionMode;
}): Promise<ResolvedAuthenticatedUserResult> {
  const { pb, hasAuthCookie, hadInvalidAuthCookie, shouldPersistSession } =
    await createPocketBaseServerClient();

  if (hadInvalidAuthCookie) {
    return createUnauthorizedResolution(input.mode, createClearedAuthAndDeviceCookies());
  }

  const authenticatedUser = getAuthenticatedUserFromStore(pb);

  if (!authenticatedUser) {
    return createUnauthorizedResolution(
      input.mode,
      hasAuthCookie ? createClearedAuthAndDeviceCookies() : undefined
    );
  }

  try {
    const deviceSessionCheck = await resolveCurrentAuthDeviceSession({
      pb,
      userId: authenticatedUser.id,
      mode: input.mode === "render" ? "read" : "write",
    });

    if (deviceSessionCheck.status === "invalid") {
      return createUnauthorizedResolution(input.mode, deviceSessionCheck.setCookie);
    }

    if (input.mode === "render") {
      const user = await getVerifiedUserRecordReadOnly(pb, authenticatedUser);

      if (!user) {
        return createUnauthorizedResolution(input.mode);
      }

      return {
        ok: true,
        pb,
        user,
        currentSessionIdHash: deviceSessionCheck.sessionIdHash,
      };
    }

    const refreshedAuth = await refreshCurrentAuthRecord(pb);

    if (refreshedAuth.status === "verified") {
      return {
        ok: true,
        pb,
        user: refreshedAuth.user,
        currentSessionIdHash: deviceSessionCheck.sessionIdHash,
        ...(input.mode === "response"
          ? {
              setCookie: exportPocketBaseAuthCookies(pb, {
                sessionOnly: !shouldPersistSession,
              }),
            }
          : {}),
      };
    }

    if (input.mode === "response" && refreshedAuth.status === "unverified") {
      return createUnauthorizedResolution(
        input.mode,
        exportPocketBaseAuthCookies(pb, {
          sessionOnly: !shouldPersistSession,
        })
      );
    }

    return createUnauthorizedResolution(input.mode, createClearedAuthAndDeviceCookies());
  } catch (error) {
    if (
      input.mode === "response" &&
      isTransientError(error) &&
      authenticatedUser.verified === true
    ) {
      console.warn("[auth-user-resolution] resolveAuthenticatedUser.response stale session");

      return {
        ok: false,
        errorCode: "UNKNOWN_ERROR",
        pb,
        staleUser: authenticatedUser,
      };
    }

    logServiceError("auth-user-resolution", `resolveAuthenticatedUser.${input.mode}`, error);

    return input.mode === "response"
      ? {
          ok: false,
          errorCode: "UNKNOWN_ERROR",
          setCookie: createClearedAuthAndDeviceCookies(),
        }
      : {
          ok: false,
          errorCode: "UNKNOWN_ERROR",
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

function createUnauthorizedResolution(
  mode: AuthResolutionMode,
  setCookie?: string[]
): ResolvedAuthenticatedUserResult {
  if (mode === "render") {
    return {
      ok: false,
      errorCode: "UNAUTHORIZED",
    };
  }

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
