import { ClientResponseError } from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import type {
  AuthSessionPayload,
  AuthSignOutPayload,
} from "@/features/auth/auth-contract";
import type { SignInInput } from "@/features/auth/auth-schemas";
import {
  createPocketBaseServerClient,
  exportPocketBaseAuthCookies,
} from "@/server/pocketbase/pocketbase-server";
import {
  createClearedAuthAndDeviceCookies,
  readDeviceSessionCookie,
} from "@/server/device-sessions/device-sessions-cookie";
import {
  hashSessionToken,
  revokeCurrentDeviceSession,
  validateDeviceSessionOrInvalidate,
} from "@/server/device-sessions/device-sessions-service";
import {
  formatServiceError,
  isUsersRecord,
} from "@/server/pocketbase/pocketbase-utils";
import { clearActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";
import {
  logAuthServiceError,
  mapSignInErrorCode,
  isTransientError,
} from "@/server/auth/auth-errors";
import {
  createAuthAndDeviceCookies,
  createAuthSession,
} from "@/server/auth/auth-session-utils";
import type { ServerAuthResponse } from "@/server/auth/auth-response";

export async function signInWithPassword(
  input: SignInInput
): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const { pb, hadInvalidAuthCookie } = await createPocketBaseServerClient();

  try {
    const authResponse = await pb
      .collection("users")
      .authWithPassword<UsersRecord>(input.email, input.password);
    const setCookie = await createAuthAndDeviceCookies({
      pb,
      userId: authResponse.record.id,
      rememberMe: input.rememberMe,
      logContext: "signInWithPassword",
    });

    if (authResponse.record.verified !== true) {
      return {
        ok: false,
        errorCode: "EMAIL_NOT_VERIFIED",
        setCookie,
      };
    }

    const session = createAuthSession(pb, authResponse.record);

    if (!session) {
      return {
        ok: false,
        errorCode: "UNKNOWN_ERROR",
      };
    }

    return {
      ok: true,
      data: {
        session,
      },
      setCookie,
    };
  } catch (error) {
    const errorCode = mapSignInErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("signInWithPassword", error);
    }

    return {
      ok: false,
      errorCode,
      ...(hadInvalidAuthCookie ? { setCookie: createClearedAuthAndDeviceCookies() } : {}),
    };
  }
}

export async function signOutServerSession(): Promise<ServerAuthResponse<AuthSignOutPayload>> {
  const { pb } = await createPocketBaseServerClient();

  const deviceSessionToken = await readDeviceSessionCookie();

  if (deviceSessionToken && pb.authStore.isValid && isUsersRecord(pb.authStore.record)) {
    try {
      await revokeCurrentDeviceSession({
        pb,
        userId: pb.authStore.record.id,
        currentSessionIdHash: hashSessionToken(deviceSessionToken),
      });
    } catch (error) {
      console.warn(
        "[auth-service] signOutServerSession: device session revoke failed, continuing",
        formatServiceError(error)
      );
    }
  }

  await clearActiveWorkspaceSlugCookie();

  return {
    ok: true,
    data: {
      signedOut: true,
    },
    setCookie: createClearedAuthAndDeviceCookies(),
  };
}

export async function getServerAuthSession(): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const { pb, hasAuthCookie, hadInvalidAuthCookie, shouldPersistSession } =
    await createPocketBaseServerClient();

  if (hadInvalidAuthCookie) {
    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedAuthAndDeviceCookies(),
    };
  }

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return {
      ok: true,
      data: {
        session: null,
      },
      ...(hasAuthCookie ? { setCookie: createClearedAuthAndDeviceCookies() } : {}),
    };
  }

  if (!isUsersRecord(pb.authStore.record)) {
    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedAuthAndDeviceCookies(),
    };
  }

  try {
    const deviceSessionToken = await readDeviceSessionCookie();
    const deviceSessionCheck = await validateDeviceSessionOrInvalidate({
      pb,
      userId: pb.authStore.record.id,
      deviceSessionToken,
      shouldUpdateHeartbeat: false,
    });

    if (deviceSessionCheck.status === "invalid") {
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: deviceSessionCheck.clearCookies,
      };
    }

    const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();

    if (refreshedAuth.record.verified !== true) {
      console.warn("[auth-service] getServerAuthSession: unverified user session detected");

      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: exportPocketBaseAuthCookies(pb, {
          sessionOnly: !shouldPersistSession,
        }),
      };
    }

    const session = createAuthSession(pb, refreshedAuth.record);

    if (!session) {
      return {
        ok: true,
        data: {
          session: null,
        },
      };
    }

    return {
      ok: true,
      data: {
        session,
      },
    };
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      console.warn("[auth-service] getServerAuthSession: user record not found, clearing session");
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: createClearedAuthAndDeviceCookies(),
      };
    }

    if (
      error instanceof ClientResponseError &&
      (error.status === 400 || error.status === 401 || error.status === 403)
    ) {
      console.warn("[auth-service] getServerAuthSession: auth refresh failed, clearing session");
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: createClearedAuthAndDeviceCookies(),
      };
    }

    logAuthServiceError("getServerAuthSession", error);

    if (
      isTransientError(error) &&
      isUsersRecord(pb.authStore.record) &&
      pb.authStore.record.verified === true
    ) {
      console.warn("[auth-service] getServerAuthSession: PB unavailable, stale session");
      const staleSession = createAuthSession(pb, pb.authStore.record);

      return {
        ok: true,
        data: {
          session: staleSession,
        },
      };
    }

    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedAuthAndDeviceCookies(),
    };
  }
}

export async function getApiAuthSession(): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const { pb, hasAuthCookie, hadInvalidAuthCookie, shouldPersistSession } =
    await createPocketBaseServerClient();

  if (hadInvalidAuthCookie) {
    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedAuthAndDeviceCookies(),
    };
  }

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return {
      ok: true,
      data: {
        session: null,
      },
      ...(hasAuthCookie ? { setCookie: createClearedAuthAndDeviceCookies() } : {}),
    };
  }

  if (!isUsersRecord(pb.authStore.record)) {
    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedAuthAndDeviceCookies(),
    };
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
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: deviceSessionCheck.clearCookies,
      };
    }

    const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();

    if (refreshedAuth.record.verified !== true) {
      console.warn("[auth-service] getApiAuthSession: unverified user session detected");

      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: exportPocketBaseAuthCookies(pb, {
          sessionOnly: !shouldPersistSession,
        }),
      };
    }

    const session = createAuthSession(pb, refreshedAuth.record);

    if (!session) {
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: createClearedAuthAndDeviceCookies(),
      };
    }

    return {
      ok: true,
      data: {
        session,
      },
      setCookie: exportPocketBaseAuthCookies(pb, {
        sessionOnly: !shouldPersistSession,
      }),
    };
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      console.warn("[auth-service] getApiAuthSession: user record not found, clearing session");
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: createClearedAuthAndDeviceCookies(),
      };
    }

    logAuthServiceError("getApiAuthSession", error);

    if (
      isTransientError(error) &&
      isUsersRecord(pb.authStore.record) &&
      pb.authStore.record.verified === true
    ) {
      console.warn("[auth-service] getApiAuthSession: PB unavailable, stale session");
      const staleSession = createAuthSession(pb, pb.authStore.record);

      return {
        ok: true,
        data: {
          session: staleSession,
        },
      };
    }

    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedAuthAndDeviceCookies(),
    };
  }
}
