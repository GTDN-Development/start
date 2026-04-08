import PocketBase, { ClientResponseError } from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import type { AuthSessionPayload } from "@/features/auth/auth-types";
import {
  createPocketBaseServerClient,
  exportPocketBaseAuthCookies,
} from "@/server/pocketbase/pocketbase-server";
import {
  createClearedAuthAndDeviceCookies,
  readDeviceSessionCookie,
} from "@/server/device-sessions/device-sessions-cookie";
import {
  checkDeviceSessionReadOnly,
  validateDeviceSessionOrInvalidate,
} from "@/server/device-sessions/device-sessions-service";
import { createAuthSession } from "@/server/auth/auth-session-utils";
import { isTransientError, logAuthServiceError } from "@/server/auth/auth-errors";
import type { ServerAuthResponse } from "@/server/auth/auth-response";
import {
  formatServiceError,
  isUsersRecord,
  logServiceError,
} from "@/server/pocketbase/pocketbase-utils";

type AuthResolutionMode = "readOnlyUser" | "actionUser" | "responseSession";

export type ResolvedReadOnlyAuthUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
      currentSessionIdHash: string;
    }
  | {
      ok: false;
      errorCode: "UNAUTHORIZED" | "UNKNOWN_ERROR";
    };

export type ResolvedActionAuthUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
      currentSessionIdHash: string;
    }
  | {
      ok: false;
      errorCode: "UNAUTHORIZED" | "UNKNOWN_ERROR";
      setCookie?: string[];
    };

export async function resolveReadOnlyAuthUser(): Promise<ResolvedReadOnlyAuthUserResult> {
  return resolveAuth("readOnlyUser");
}

export async function resolveActionAuthUser(): Promise<ResolvedActionAuthUserResult> {
  return resolveAuth("actionUser");
}

export async function resolveResponseAuthSession(): Promise<ServerAuthResponse<AuthSessionPayload>> {
  return resolveAuth("responseSession");
}

async function resolveAuth(
  mode: "readOnlyUser"
): Promise<ResolvedReadOnlyAuthUserResult>;
async function resolveAuth(
  mode: "actionUser"
): Promise<ResolvedActionAuthUserResult>;
async function resolveAuth(
  mode: "responseSession"
): Promise<ServerAuthResponse<AuthSessionPayload>>;
async function resolveAuth(mode: AuthResolutionMode) {
  const client = await createPocketBaseServerClient();

  if (mode === "readOnlyUser") {
    return resolveReadOnlyUser(client);
  }

  if (mode === "actionUser") {
    return resolveActionUser(client);
  }

  return resolveResponseSession(client);
}

async function resolveReadOnlyUser(
  client: Awaited<ReturnType<typeof createPocketBaseServerClient>>
): Promise<ResolvedReadOnlyAuthUserResult> {
  const { pb, hadInvalidAuthCookie } = client;

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

async function resolveActionUser(
  client: Awaited<ReturnType<typeof createPocketBaseServerClient>>
): Promise<ResolvedActionAuthUserResult> {
  const { pb, hasAuthCookie, hadInvalidAuthCookie } = client;

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

async function resolveResponseSession(
  client: Awaited<ReturnType<typeof createPocketBaseServerClient>>
): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const { pb, hasAuthCookie, hadInvalidAuthCookie, shouldPersistSession } = client;

  if (hadInvalidAuthCookie) {
    return createSessionResponse(null, createClearedAuthAndDeviceCookies());
  }

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return createSessionResponse(
      null,
      hasAuthCookie ? createClearedAuthAndDeviceCookies() : undefined
    );
  }

  if (!isUsersRecord(pb.authStore.record)) {
    return createSessionResponse(null, createClearedAuthAndDeviceCookies());
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
      return createSessionResponse(null, deviceSessionCheck.clearCookies);
    }

    const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();

    if (refreshedAuth.record.verified !== true) {
      console.warn("[auth-service] getResponseAuthSession: unverified user session detected");

      return createSessionResponse(
        null,
        exportPocketBaseAuthCookies(pb, {
          sessionOnly: !shouldPersistSession,
        })
      );
    }

    const session = createAuthSession(pb, refreshedAuth.record);

    if (!session) {
      return createSessionResponse(null, createClearedAuthAndDeviceCookies());
    }

    return createSessionResponse(
      session,
      exportPocketBaseAuthCookies(pb, {
        sessionOnly: !shouldPersistSession,
      })
    );
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      console.warn("[auth-service] getResponseAuthSession: user record not found, clearing session");

      return createSessionResponse(null, createClearedAuthAndDeviceCookies());
    }

    logAuthServiceError("getResponseAuthSession", error);

    if (
      isTransientError(error) &&
      isUsersRecord(pb.authStore.record) &&
      pb.authStore.record.verified === true
    ) {
      console.warn("[auth-service] getResponseAuthSession: PB unavailable, stale session");

      return createSessionResponse(createAuthSession(pb, pb.authStore.record));
    }

    return createSessionResponse(null, createClearedAuthAndDeviceCookies());
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

function createReadOnlyUnauthorizedResult(): ResolvedReadOnlyAuthUserResult {
  return {
    ok: false,
    errorCode: "UNAUTHORIZED",
  };
}

function createActionUnauthorizedResult(
  setCookie?: string[]
): ResolvedActionAuthUserResult {
  return {
    ok: false,
    errorCode: "UNAUTHORIZED",
    ...(setCookie ? { setCookie } : {}),
  };
}

function createSessionResponse(
  session: AuthSessionPayload["session"],
  setCookie?: string[]
): ServerAuthResponse<AuthSessionPayload> {
  return {
    ok: true,
    data: {
      session,
    },
    ...(setCookie ? { setCookie } : {}),
  };
}

function isAuthRefreshUnauthorizedError(error: unknown) {
  return (
    error instanceof ClientResponseError &&
    (error.status === 400 || error.status === 401 || error.status === 403 || error.status === 404)
  );
}
