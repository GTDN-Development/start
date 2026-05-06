import PocketBase, { ClientResponseError } from "pocketbase";
import type {
  ConfirmEmailChangePayload,
  RequestEmailVerificationPayload,
  VerifyEmailPayload,
} from "@/features/auth/auth-types";
import type { UsersRecord } from "@/types/pocketbase";
import {
  createClearedPocketBaseAuthCookieMutations,
  createPocketBaseServerClient,
  createPocketBaseAuthCookieMutations,
} from "@/server/pocketbase/pocketbase-server";
import {
  logAuthServiceError,
  mapConfirmEmailChangeErrorCode,
  mapVerifyEmailErrorCode,
} from "@/server/auth/auth-errors";
import {
  createAuthSession,
  isProbablyConsumedVerificationToken,
} from "@/server/auth/auth-session-utils";
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
      ...(hadInvalidAuthCookie
        ? { cookieMutations: createClearedPocketBaseAuthCookieMutations() }
        : {}),
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
        ...(hadInvalidAuthCookie
          ? { cookieMutations: createClearedPocketBaseAuthCookieMutations() }
          : {}),
      };
    }

    const errorCode = mapVerifyEmailErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("confirmEmailVerificationToken", error);
    }

    return {
      ok: false,
      errorCode,
      ...(hadInvalidAuthCookie
        ? { cookieMutations: createClearedPocketBaseAuthCookieMutations() }
        : {}),
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
        ...(hadInvalidAuthCookie
          ? { cookieMutations: createClearedPocketBaseAuthCookieMutations() }
          : {}),
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
    ...(hadInvalidAuthCookie
      ? { cookieMutations: createClearedPocketBaseAuthCookieMutations() }
      : {}),
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
      cookieMutations: createClearedPocketBaseAuthCookieMutations(),
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
        ? { cookieMutations: createClearedPocketBaseAuthCookieMutations() }
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
    const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();

    if (!isUsersRecord(refreshedAuth.record) || refreshedAuth.record.verified !== true) {
      return null;
    }

    const session = createAuthSession(pb, refreshedAuth.record);

    if (!session) {
      return {
        ok: true,
        data: {
          session: null,
        },
        cookieMutations: createClearedPocketBaseAuthCookieMutations(),
      };
    }

    return {
      ok: true,
      data: {
        session,
      },
      cookieMutations: createPocketBaseAuthCookieMutations(pb, {
        sessionOnly: !shouldPersistSession,
      }),
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
