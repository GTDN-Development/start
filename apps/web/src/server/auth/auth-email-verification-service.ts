import PocketBase, { ClientResponseError } from "pocketbase";
import type {
  ConfirmEmailChangePayload,
  RequestEmailVerificationPayload,
  VerifyEmailPayload,
} from "@/features/auth/auth-types";
import {
  createClearedPocketBaseAuthCookies,
  createPocketBaseServerClient,
} from "@/server/pocketbase/pocketbase-server";
import {
  createClearedAuthAndDeviceCookies,
  readDeviceSessionCookie,
} from "@/server/device-sessions/device-sessions-cookie";
import { createAuthAndDeviceCookies } from "@/server/device-sessions/device-sessions-service";
import {
  logAuthServiceError,
  mapConfirmEmailChangeErrorCode,
  mapVerifyEmailErrorCode,
} from "@/server/auth/auth-errors";
import {
  createAuthSession,
  isProbablyConsumedVerificationToken,
} from "@/server/auth/auth-session-utils";
import { refreshCurrentAuthRecord } from "@/server/auth/auth-user-resolution";
import type { ServerAuthResponse } from "@/server/auth/auth-response";
import { isUsersRecord } from "@/server/pocketbase/pocketbase-utils";

export async function confirmEmailVerificationToken(
  token: string
): Promise<ServerAuthResponse<VerifyEmailPayload>> {
  const { authCookieState, pb, shouldPersistSession } = await createPocketBaseServerClient();
  const hadInvalidAuthCookie = authCookieState === "invalid";
  const hadUnverifiedAuthenticatedSession =
    pb.authStore.isValid &&
    isUsersRecord(pb.authStore.record) &&
    pb.authStore.record.verified !== true;

  try {
    await pb.collection("users").confirmVerification(token);

    const confirmedSessionResponse = await getVerifiedSessionResponse(pb, shouldPersistSession);

    if (confirmedSessionResponse) {
      return confirmedSessionResponse;
    }

    return {
      ok: true,
      data: {
        session: null,
      },
      ...(hadInvalidAuthCookie ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  } catch (error) {
    if (mapVerifyEmailErrorCode(error) === "BAD_REQUEST" && hadUnverifiedAuthenticatedSession) {
      const verifiedAfterRetryResponse = await getVerifiedSessionResponse(pb, shouldPersistSession);

      if (verifiedAfterRetryResponse) {
        return verifiedAfterRetryResponse;
      }
    }

    if (
      mapVerifyEmailErrorCode(error) === "BAD_REQUEST" &&
      isProbablyConsumedVerificationToken(token)
    ) {
      return {
        ok: true,
        data: {
          session: null,
        },
        ...(hadInvalidAuthCookie ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
      };
    }

    const errorCode = mapVerifyEmailErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("confirmEmailVerificationToken", error);
    }

    return {
      ok: false,
      errorCode,
      ...(hadInvalidAuthCookie ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }
}

export async function requestEmailVerificationForEmail(
  email: string
): Promise<ServerAuthResponse<RequestEmailVerificationPayload>> {
  const { authCookieState, pb } = await createPocketBaseServerClient();
  const hadInvalidAuthCookie = authCookieState === "invalid";

  try {
    await pb.collection("users").requestVerification(email);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 429) {
      return {
        ok: false,
        errorCode: "RATE_LIMITED",
        ...(hadInvalidAuthCookie ? { setCookie: createClearedAuthAndDeviceCookies() } : {}),
      };
    }

    if (!(error instanceof ClientResponseError) || (error.status !== 400 && error.status !== 404)) {
      logAuthServiceError("requestEmailVerificationForEmail", error);
    }
  }

  return {
    ok: true,
    data: {
      sent: true,
    },
    ...(hadInvalidAuthCookie ? { setCookie: createClearedAuthAndDeviceCookies() } : {}),
  };
}

export async function confirmEmailChangeToken(input: {
  token: string;
  password: string;
}): Promise<ServerAuthResponse<ConfirmEmailChangePayload>> {
  const { authCookieState, pb } = await createPocketBaseServerClient();
  const hadInvalidAuthCookie = authCookieState === "invalid";

  try {
    await pb.collection("users").confirmEmailChange(input.token, input.password);

    return {
      ok: true,
      data: {
        emailChanged: true,
      },
      setCookie: createClearedAuthAndDeviceCookies(),
    };
  } catch (error) {
    const errorCode = mapConfirmEmailChangeErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("confirmEmailChangeToken", error);
    }

    return {
      ok: false,
      errorCode,
      ...(errorCode === "UNAUTHORIZED" || hadInvalidAuthCookie
        ? { setCookie: createClearedAuthAndDeviceCookies() }
        : {}),
    };
  }
}

async function getVerifiedSessionResponse(
  pb: PocketBase,
  shouldPersistSession: boolean
): Promise<ServerAuthResponse<VerifyEmailPayload> | null> {
  if (!pb.authStore.isValid) {
    return null;
  }

  try {
    const refreshedAuth = await refreshCurrentAuthRecord(pb);

    if (refreshedAuth.status !== "verified") {
      return null;
    }

    const session = createAuthSession(pb, refreshedAuth.user);

    if (!session) {
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: createClearedPocketBaseAuthCookies(),
      };
    }

    const authCookies = await createAuthAndDeviceCookies({
      pb,
      userId: session.user.id,
      rememberMe: shouldPersistSession,
      existingDeviceSessionToken: await readDeviceSessionCookie(),
      logContext: "confirmEmailVerificationToken",
    });

    if (!authCookies.ok) {
      return authCookies;
    }

    return {
      ok: true,
      data: {
        session,
      },
      setCookie: authCookies.setCookie,
    };
  } catch (error) {
    if (
      error instanceof ClientResponseError &&
      (error.status === 400 || error.status === 401 || error.status === 403 || error.status === 404)
    ) {
      return null;
    }

    throw error;
  }
}
