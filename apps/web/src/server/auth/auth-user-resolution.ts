import PocketBase, { ClientResponseError } from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import { isTransientError } from "@/server/auth/auth-errors";
import { createClearedAuthAndDeviceCookies } from "@/server/device-sessions/device-sessions-cookie";
import { resolveCurrentAuthDeviceSession } from "@/server/device-sessions/device-sessions-service";
import {
  createPocketBaseServerClient,
  exportPocketBaseAuthCookies,
} from "@/server/pocketbase/pocketbase-server";
import { isUsersRecord, logServiceError } from "@/server/pocketbase/pocketbase-utils";

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

export type ResolveCurrentServerAuthInput =
  | {
      mode: "read";
    }
  | {
      mode: "write";
    };

export type ResolvedCurrentServerAuthAuthenticatedResult = {
  status: "authenticated";
  pb: PocketBase;
  user: UsersRecord;
  currentSessionIdHash: string;
  setCookie?: string[];
  isStale?: true;
};

export type ResolvedCurrentServerAuthResult =
  | ResolvedCurrentServerAuthAuthenticatedResult
  | {
      status: "unauthorized";
      setCookie?: string[];
    }
  | {
      status: "unverified";
      setCookie: string[];
    }
  | {
      status: "unknown_error";
      setCookie?: string[];
    };

export async function resolveCurrentServerAuth(
  input: ResolveCurrentServerAuthInput
): Promise<ResolvedCurrentServerAuthResult> {
  const { authCookieState, pb, shouldPersistSession } = await createPocketBaseServerClient();

  if (authCookieState === "invalid") {
    return input.mode === "write"
      ? createUnauthorizedServerAuthResult(createClearedAuthAndDeviceCookies())
      : createUnauthorizedServerAuthResult();
  }

  const authenticatedUser = getAuthenticatedUserFromStore(pb);

  if (!authenticatedUser) {
    return input.mode === "write" && authCookieState === "present"
      ? createUnauthorizedServerAuthResult(createClearedAuthAndDeviceCookies())
      : createUnauthorizedServerAuthResult();
  }

  let currentSessionIdHash: string | null = null;

  try {
    const deviceSessionCheck =
      input.mode === "write"
        ? await resolveCurrentAuthDeviceSession({
            pb,
            userId: authenticatedUser.id,
            mode: "write",
            shouldPersistSession,
          })
        : await resolveCurrentAuthDeviceSession({
            pb,
            userId: authenticatedUser.id,
            mode: "read",
          });

    if (deviceSessionCheck.status === "invalid") {
      return input.mode === "write"
        ? createUnauthorizedServerAuthResult(deviceSessionCheck.setCookie)
        : createUnauthorizedServerAuthResult();
    }

    currentSessionIdHash = deviceSessionCheck.sessionIdHash;

    if (input.mode === "read") {
      const user = await getVerifiedUserRecordReadOnly(pb, authenticatedUser);

      return user
        ? createAuthenticatedServerAuthResult(pb, user, currentSessionIdHash)
        : createUnauthorizedServerAuthResult();
    }

    const refreshedAuth = await refreshCurrentAuthRecord(pb);
    const setCookie = exportPocketBaseAuthCookies(pb, {
      sessionOnly: !shouldPersistSession,
    });

    if (refreshedAuth.status === "verified") {
      return createAuthenticatedServerAuthResult(pb, refreshedAuth.user, currentSessionIdHash, {
        setCookie,
      });
    }

    if (refreshedAuth.status === "unverified") {
      return {
        status: "unverified",
        setCookie,
      };
    }

    return createUnauthorizedServerAuthResult(createClearedAuthAndDeviceCookies());
  } catch (error) {
    if (
      input.mode === "write" &&
      currentSessionIdHash &&
      isTransientError(error) &&
      authenticatedUser.verified === true
    ) {
      console.warn("[auth-user-resolution] resolveCurrentServerAuth stale session");

      return createAuthenticatedServerAuthResult(pb, authenticatedUser, currentSessionIdHash, {
        isStale: true,
      });
    }

    logServiceError("auth-user-resolution", `resolveCurrentServerAuth.${input.mode}`, error);

    return input.mode === "write"
      ? {
          status: "unknown_error",
          setCookie: createClearedAuthAndDeviceCookies(),
        }
      : {
          status: "unknown_error",
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

function createAuthenticatedServerAuthResult(
  pb: PocketBase,
  user: UsersRecord,
  currentSessionIdHash: string,
  options: {
    setCookie?: string[];
    isStale?: true;
  } = {}
): ResolvedCurrentServerAuthAuthenticatedResult {
  return {
    status: "authenticated",
    pb,
    user,
    currentSessionIdHash,
    ...(options.setCookie ? { setCookie: options.setCookie } : {}),
    ...(options.isStale ? { isStale: true } : {}),
  };
}

function createUnauthorizedServerAuthResult(setCookie?: string[]): ResolvedCurrentServerAuthResult {
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
