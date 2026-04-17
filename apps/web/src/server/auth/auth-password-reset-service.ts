import { ClientResponseError } from "pocketbase";
import type { RequestPasswordResetPayload, ResetPasswordPayload } from "@/features/auth/auth-types";
import {
  createClearedPocketBaseAuthCookies,
  createPocketBaseServerClient,
} from "@/server/pocketbase/pocketbase-server";
import { createClearedAuthAndDeviceCookies } from "@/server/device-sessions/device-sessions-cookie";
import { logAuthServiceError, mapResetPasswordErrorCode } from "@/server/auth/auth-errors";
import type { ServerAuthResponse } from "@/server/auth/auth-response";

export async function confirmPasswordResetToken(input: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<ServerAuthResponse<ResetPasswordPayload>> {
  const { authCookieState, pb } = await createPocketBaseServerClient();
  const hadInvalidAuthCookie = authCookieState === "invalid";

  try {
    await pb
      .collection("users")
      .confirmPasswordReset(input.token, input.password, input.confirmPassword);

    return {
      ok: true,
      data: {
        passwordReset: true,
      },
      setCookie: createClearedAuthAndDeviceCookies(),
    };
  } catch (error) {
    const errorCode = mapResetPasswordErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("confirmPasswordResetToken", error);
    }

    return {
      ok: false,
      errorCode,
      ...(hadInvalidAuthCookie ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }
}

export async function requestPasswordResetForEmail(
  email: string
): Promise<ServerAuthResponse<RequestPasswordResetPayload>> {
  const { pb } = await createPocketBaseServerClient();

  try {
    await pb.collection("users").requestPasswordReset(email);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 429) {
      return {
        ok: false,
        errorCode: "RATE_LIMITED",
      };
    }

    if (!(error instanceof ClientResponseError) || (error.status !== 400 && error.status !== 404)) {
      logAuthServiceError("requestPasswordResetForEmail", error);
    }
  }

  return {
    ok: true,
    data: {
      sent: true,
    },
  };
}
