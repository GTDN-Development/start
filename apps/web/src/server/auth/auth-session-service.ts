import type { UsersRecord } from "@/types/pocketbase";
import type { AuthSessionPayload, AuthSignOutPayload } from "@/features/auth/auth-types";
import type { SignInInput } from "@/features/auth/auth-schemas";
import {
  createPocketBaseServerClient,
  exportPocketBaseAuthCookies,
} from "@/server/pocketbase/pocketbase-server";
import { createClearedAuthAndDeviceCookies } from "@/server/device-sessions/device-sessions-cookie";
import { logAuthServiceError, mapSignInErrorCode } from "@/server/auth/auth-errors";
import {
  createAuthAndDeviceCookies,
  revokeCurrentAuthDeviceSession,
} from "@/server/device-sessions/device-sessions-service";
import { resolveCurrentServerAuth } from "@/server/auth/auth-user-resolution";
import { createAuthSession } from "@/server/auth/auth-session-utils";
import type { ServerAuthResponse } from "@/server/auth/auth-response";

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

    const authCookies = await createAuthAndDeviceCookies({
      pb,
      userId: authResponse.record.id,
      rememberMe: input.rememberMe,
      logContext: "signInWithPassword",
    });

    if (!authCookies.ok) {
      return authCookies;
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
      setCookie: authCookies.setCookie,
    };
  } catch (error) {
    const errorCode = mapSignInErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("signInWithPassword", error);
    }

    return {
      ok: false,
      errorCode,
      ...(authCookieState === "invalid" ? { setCookie: createClearedAuthAndDeviceCookies() } : {}),
    };
  }
}

export async function signOutServerSession(): Promise<ServerAuthResponse<AuthSignOutPayload>> {
  const { pb } = await createPocketBaseServerClient();

  await revokeCurrentAuthDeviceSession({
    pb,
    logContext: "signOutServerSession",
  });

  return {
    ok: true,
    data: {
      signedOut: true,
    },
    setCookie: createClearedAuthAndDeviceCookies(),
  };
}

export async function getServerAuthSession(): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const currentUser = await resolveCurrentServerAuth({
    mode: "read",
  });

  if (currentUser.status !== "authenticated") {
    if (currentUser.status === "unknown_error") {
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
  const currentUser = await resolveCurrentServerAuth({
    mode: "write",
  });

  if (currentUser.status !== "authenticated") {
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
