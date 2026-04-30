import PocketBase, { ClientResponseError } from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import type { AuthSessionPayload, AuthSignOutPayload } from "@/features/auth/auth-types";
import type { SignInInput } from "@/features/auth/auth-schemas";
import {
  createClearedPocketBaseAuthCookies,
  createPocketBaseServerClient,
  exportPocketBaseAuthCookies,
} from "@/server/pocketbase/pocketbase-server";
import {
  isTransientError,
  logAuthServiceError,
  mapSignInErrorCode,
} from "@/server/auth/auth-errors";
import { createAuthSession } from "@/server/auth/auth-session-utils";
import type { ServerAuthResponse } from "@/server/auth/auth-response";
import { isUsersRecord, logServiceError } from "@/server/pocketbase/pocketbase-utils";

type CurrentAuthResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
      setCookie?: string[];
      isStale?: true;
    }
  | CurrentAuthFailureResult;

type RequireCurrentUserErrorCode = "UNAUTHORIZED" | "UNKNOWN_ERROR";

type RequireCurrentUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
    }
  | {
      ok: false;
      errorCode: RequireCurrentUserErrorCode;
    };

type RequireCurrentWritableUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
    }
  | {
      ok: false;
      errorCode: RequireCurrentUserErrorCode;
      setCookie?: string[];
    };

type CurrentAuthFailureResult = Extract<RequireCurrentWritableUserResult, { ok: false }>;

export async function signInWithPassword(
  input: SignInInput
): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const { authCookieState, pb } = await createPocketBaseServerClient();

  try {
    const authResponse = await pb
      .collection("users")
      .authWithPassword<UsersRecord>(input.email, input.password);

    if (authResponse.record.verified !== true) {
      return {
        ok: false,
        errorCode: "EMAIL_NOT_VERIFIED",
        setCookie: exportPocketBaseAuthCookies(pb, {
          sessionOnly: !input.rememberMe,
        }),
      };
    }

    return {
      ok: true,
      data: {
        session: createAuthSession(pb, authResponse.record),
      },
      setCookie: exportPocketBaseAuthCookies(pb, {
        sessionOnly: !input.rememberMe,
      }),
    };
  } catch (error) {
    const errorCode = mapSignInErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("signInWithPassword", error);
    }

    return {
      ok: false,
      errorCode,
      ...(authCookieState === "invalid" ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }
}

export async function signOutServerSession(): Promise<ServerAuthResponse<AuthSignOutPayload>> {
  return {
    ok: true,
    data: {
      signedOut: true,
    },
    setCookie: createClearedPocketBaseAuthCookies(),
  };
}

export async function getServerAuthSession(): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const currentUser = await resolveCurrentServerAuth("read");

  if (!currentUser.ok) {
    if (currentUser.errorCode === "UNKNOWN_ERROR") {
      return {
        ok: false,
        errorCode: "UNKNOWN_ERROR",
      };
    }

    return {
      ok: true,
      data: {
        session: null,
      },
    };
  }

  const session = createAuthSession(currentUser.pb, currentUser.user);

  return {
    ok: true,
    data: {
      session,
    },
  };
}

export async function getResponseAuthSession(): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const currentUser = await resolveCurrentServerAuth("write");

  if (!currentUser.ok) {
    return {
      ok: true,
      data: {
        session: null,
      },
      ...(currentUser.setCookie ? { setCookie: currentUser.setCookie } : {}),
    };
  }

  return {
    ok: true,
    data: {
      session: createAuthSession(currentUser.pb, currentUser.user),
    },
    ...(currentUser.setCookie ? { setCookie: currentUser.setCookie } : {}),
  };
}

export async function requireCurrentUser(): Promise<RequireCurrentUserResult> {
  const currentUser = await resolveCurrentServerAuth("read");

  if (!currentUser.ok) {
    return currentUser;
  }

  return {
    ok: true,
    pb: currentUser.pb,
    user: currentUser.user,
  };
}

export async function requireCurrentWritableUser(): Promise<RequireCurrentWritableUserResult> {
  const currentUser = await resolveCurrentServerAuth("write");

  if (!currentUser.ok) {
    return currentUser;
  }

  if (currentUser.isStale) {
    return {
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    };
  }

  return {
    ok: true,
    pb: currentUser.pb,
    user: currentUser.user,
  };
}

async function resolveCurrentServerAuth(mode: "read" | "write"): Promise<CurrentAuthResult> {
  const { authCookieState, pb, shouldPersistSession } = await createPocketBaseServerClient();

  if (authCookieState === "invalid") {
    return createCurrentAuthFailure({
      setCookie: mode === "write" ? createClearedPocketBaseAuthCookies() : undefined,
    });
  }

  const authenticatedUser = getAuthenticatedUserFromStore(pb);

  if (!authenticatedUser) {
    return createCurrentAuthFailure({
      setCookie:
        mode === "write" && authCookieState === "present"
          ? createClearedPocketBaseAuthCookies()
          : undefined,
    });
  }

  try {
    if (mode === "read") {
      const user = await getVerifiedUserRecordReadOnly(pb, authenticatedUser);

      return user ? createCurrentAuthSuccess(pb, user) : createCurrentAuthFailure();
    }

    const refreshedUser = await refreshVerifiedAuthRecord(pb);

    if (refreshedUser === "unauthorized") {
      return createCurrentAuthFailure({
        setCookie: createClearedPocketBaseAuthCookies(),
      });
    }

    const setCookie = exportPocketBaseAuthCookies(pb, {
      sessionOnly: !shouldPersistSession,
    });

    return refreshedUser
      ? createCurrentAuthSuccess(pb, refreshedUser, { setCookie })
      : createCurrentAuthFailure({ setCookie });
  } catch (error) {
    if (mode === "write" && isTransientError(error) && authenticatedUser.verified === true) {
      console.warn("[auth-session-service] resolveCurrentServerAuth stale session");

      return createCurrentAuthSuccess(pb, authenticatedUser, {
        isStale: true,
      });
    }

    logServiceError("auth-session-service", `resolveCurrentServerAuth.${mode}`, error);

    return createCurrentAuthFailure({
      errorCode: "UNKNOWN_ERROR",
      setCookie: mode === "write" ? createClearedPocketBaseAuthCookies() : undefined,
    });
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
    if (isAuthUnauthorizedError(error)) {
      return null;
    }

    if (isTransientError(error) && authenticatedUser.verified === true) {
      console.warn("[auth-session-service] getVerifiedUserRecordReadOnly transient backend error");
      return authenticatedUser;
    }

    throw error;
  }
}

async function refreshVerifiedAuthRecord(
  pb: PocketBase
): Promise<UsersRecord | "unauthorized" | null> {
  try {
    const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();

    return isUsersRecord(refreshedAuth.record) && refreshedAuth.record.verified === true
      ? refreshedAuth.record
      : null;
  } catch (error) {
    if (isAuthUnauthorizedError(error)) {
      return "unauthorized";
    }

    throw error;
  }
}

function createCurrentAuthSuccess(
  pb: PocketBase,
  user: UsersRecord,
  options: {
    setCookie?: string[];
    isStale?: true;
  } = {}
): CurrentAuthResult {
  return {
    ok: true,
    pb,
    user,
    ...(options.setCookie ? { setCookie: options.setCookie } : {}),
    ...(options.isStale ? { isStale: true } : {}),
  };
}

function createCurrentAuthFailure(
  options: {
    errorCode?: RequireCurrentUserErrorCode;
    setCookie?: string[];
  } = {}
): CurrentAuthFailureResult {
  return {
    ok: false,
    errorCode: options.errorCode ?? "UNAUTHORIZED",
    ...(options.setCookie ? { setCookie: options.setCookie } : {}),
  };
}

function isAuthUnauthorizedError(error: unknown) {
  return (
    error instanceof ClientResponseError &&
    (error.status === 400 || error.status === 401 || error.status === 403 || error.status === 404)
  );
}
