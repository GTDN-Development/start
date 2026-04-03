import PocketBase, { ClientResponseError } from "pocketbase";
import { headers } from "next/headers";
import type { UsersRecord } from "@/types/pocketbase";
import type {
  AuthErrorCode,
  AuthResponse,
  AuthSession,
} from "@/features/auth/auth-contract";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import {
  createDeviceSessionCookie,
  generateDeviceSessionCookie,
} from "@/server/device-sessions/device-sessions-cookie";
import { registerOrRefreshDeviceSession } from "@/server/device-sessions/device-sessions-service";
import {
  formatServiceError,
  getAvatarUrl,
  getNullableTrimmedString,
  hasValidationCode,
  logServiceError,
  mapPocketBaseError,
} from "@/server/pocketbase/pocketbase-utils";
import { exportPocketBaseAuthCookies } from "@/server/pocketbase/pocketbase-server";

export type ServerAuthResponse<TData> =
  | {
      ok: true;
      data: TData;
      setCookie?: string[];
    }
  | {
      ok: false;
      errorCode: AuthErrorCode;
      setCookie?: string[];
    };

export async function createAuthAndDeviceCookies(input: {
  pb: PocketBase;
  userId: string;
  rememberMe: boolean;
  existingDeviceSessionToken?: string | null;
  logContext: string;
}): Promise<string[]> {
  const normalizedExistingDeviceSessionToken = input.existingDeviceSessionToken?.trim() ?? "";
  const nextDeviceSession =
    normalizedExistingDeviceSessionToken.length > 0
      ? {
          token: normalizedExistingDeviceSessionToken,
          setCookie: createDeviceSessionCookie(
            normalizedExistingDeviceSessionToken,
            input.rememberMe
          ),
        }
      : generateDeviceSessionCookie(input.rememberMe);

  try {
    const requestHeaders = await headers();

    await registerOrRefreshDeviceSession({
      pb: input.pb,
      userId: input.userId,
      sessionToken: nextDeviceSession.token,
      rememberMe: input.rememberMe,
      requestHeaders,
    });
  } catch (error) {
    console.warn(
      `[auth-service] ${input.logContext}: device session registration failed, continuing`,
      formatServiceError(error)
    );
  }

  return [
    ...exportPocketBaseAuthCookies(input.pb, {
      sessionOnly: !input.rememberMe,
    }),
    nextDeviceSession.setCookie,
  ];
}

export function createAuthSession(pb: PocketBase, record: UsersRecord | null): AuthSession | null {
  if (!record) {
    return null;
  }

  return {
    user: {
      id: record.id,
      email: record.email,
      name: getNullableTrimmedString(record.name),
      avatarUrl: getAvatarUrl(pb, record),
    },
  };
}

export function createDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export function isProbablyConsumedVerificationToken(token: string): boolean {
  const payload = parseJwtPayload(token);

  if (!payload || payload.type !== "verification" || typeof payload.email !== "string") {
    return false;
  }

  if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
    return false;
  }

  return payload.email.trim().length > 0;
}

export function mapSignInErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
    if (
      pocketBaseError.status === 400 ||
      pocketBaseError.status === 401 ||
      pocketBaseError.status === 404
    ) {
      return "INVALID_CREDENTIALS";
    }

    return null;
  });
}

export function mapSignUpErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
    if (pocketBaseError.status === 400) {
      if (hasValidationCode(pocketBaseError.response?.data, "email", "validation_not_unique")) {
        return "EMAIL_ALREADY_IN_USE";
      }

      if (
        hasValidationCode(
          pocketBaseError.response?.data,
          "password",
          "validation_length_out_of_range"
        )
      ) {
        return "WEAK_PASSWORD";
      }

      return "VALIDATION_ERROR";
    }

    return null;
  });
}

export function mapVerifyEmailErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
    if (pocketBaseError.status === 400 || pocketBaseError.status === 404) {
      return "BAD_REQUEST";
    }

    return null;
  });
}

export function mapResetPasswordErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
    if (pocketBaseError.status === 400 || pocketBaseError.status === 404) {
      if (
        hasValidationCode(
          pocketBaseError.response?.data,
          "password",
          "validation_length_out_of_range"
        )
      ) {
        return "WEAK_PASSWORD";
      }

      return "BAD_REQUEST";
    }

    return null;
  });
}

export function mapConfirmEmailChangeErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
    if (pocketBaseError.status === 401 || pocketBaseError.status === 403) {
      return "UNAUTHORIZED";
    }

    if (pocketBaseError.status === 400 || pocketBaseError.status === 404) {
      return "BAD_REQUEST";
    }

    return null;
  });
}

export function isTransientError(error: unknown): boolean {
  if (error instanceof ClientResponseError) {
    return error.status === 0 || error.status >= 500;
  }

  return true;
}

export function logAuthServiceError(context: string, error: unknown) {
  logServiceError("auth-service", context, error);
}

export function toAuthApiResponse<TData>(response: ServerAuthResponse<TData>): AuthResponse<TData> {
  if (response.ok) {
    return {
      ok: true,
      data: response.data,
    };
  }

  return {
    ok: false,
    errorCode: response.errorCode,
  };
}

export async function finalizeAuthAction<TData>(
  response: ServerAuthResponse<TData>
): Promise<AuthResponse<TData>> {
  await applyServerAuthCookies(response.setCookie);

  return toAuthApiResponse(response);
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const segments = token.split(".");

  if (segments.length !== 3 || !segments[1]) {
    return null;
  }

  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalizedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(Buffer.from(normalizedBase64, "base64").toString("utf8"));

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }

    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
