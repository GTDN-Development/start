import type { UsersRecord } from "@/types/pocketbase";
import type { AuthSessionPayload, AuthSignOutPayload } from "@/features/auth/auth-types";
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
} from "@/server/device-sessions/device-sessions-service";
import { formatServiceError, isUsersRecord } from "@/server/pocketbase/pocketbase-utils";
import { logAuthServiceError, mapSignInErrorCode } from "@/server/auth/auth-errors";
import { createAuthAndDeviceCookies, createAuthSession } from "@/server/auth/auth-session-utils";
import type { ServerAuthResponse } from "@/server/auth/auth-response";
import { requireCurrentUser } from "@/server/auth/current-user";
import { resolveResponseAuthSession } from "@/server/auth/auth-resolution";

export async function signInWithPassword(
  input: SignInInput
): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const { pb, hadInvalidAuthCookie } = await createPocketBaseServerClient();

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

    const setCookie = await createAuthAndDeviceCookies({
      pb,
      userId: authResponse.record.id,
      rememberMe: input.rememberMe,
      logContext: "signInWithPassword",
    });

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

  return {
    ok: true,
    data: {
      signedOut: true,
    },
    setCookie: createClearedAuthAndDeviceCookies(),
  };
}

export async function getServerAuthSession(): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const currentUser = await requireCurrentUser();

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
  return resolveResponseAuthSession();
}
