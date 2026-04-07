import type { AuthErrorCode } from "@/features/auth/auth-types";
import { createClearedAuthAndDeviceCookies } from "@/server/device-sessions/device-sessions-cookie";
import {
  hasValidationCode,
  logServiceError,
  mapPocketBaseError,
} from "@/server/pocketbase/pocketbase-utils";

export function getUnauthorizedAccountCookies(errorCode: AuthErrorCode) {
  if (errorCode !== "UNAUTHORIZED") {
    return {};
  }

  return {
    setCookie: createClearedAuthAndDeviceCookies(),
  };
}

export function mapUpdateProfileErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(
    error,
    (pocketBaseError) => {
      if (pocketBaseError.status === 401 || pocketBaseError.status === 403) {
        return "UNAUTHORIZED";
      }

      if (pocketBaseError.status === 404) {
        return "NOT_FOUND";
      }

      if (pocketBaseError.status === 400) {
        return "VALIDATION_ERROR";
      }

      return null;
    },
    "UNKNOWN_ERROR"
  );
}

export function mapRequestEmailChangeErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(
    error,
    (pocketBaseError) => {
      if (pocketBaseError.status === 401 || pocketBaseError.status === 403) {
        return "UNAUTHORIZED";
      }

      if (pocketBaseError.status === 404) {
        return "NOT_FOUND";
      }

      if (pocketBaseError.status === 400) {
        if (
          hasValidationCode(pocketBaseError.response?.data, "newEmail", "validation_not_unique") ||
          hasValidationCode(pocketBaseError.response?.data, "email", "validation_not_unique")
        ) {
          return "EMAIL_ALREADY_IN_USE";
        }

        return "VALIDATION_ERROR";
      }

      return null;
    },
    "UNKNOWN_ERROR"
  );
}

export function mapDeleteAccountPasswordErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(
    error,
    (pocketBaseError) => {
      if (
        pocketBaseError.status === 400 ||
        pocketBaseError.status === 401 ||
        pocketBaseError.status === 404
      ) {
        return "INVALID_CREDENTIALS";
      }

      if (pocketBaseError.status === 403) {
        return "UNAUTHORIZED";
      }

      return null;
    },
    "UNKNOWN_ERROR"
  );
}

export function mapDeleteAccountErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(
    error,
    (pocketBaseError) => {
      if (pocketBaseError.status === 401) {
        return "UNAUTHORIZED";
      }

      if (pocketBaseError.status === 403 || pocketBaseError.status === 400) {
        return "BAD_REQUEST";
      }

      if (pocketBaseError.status === 404) {
        return "NOT_FOUND";
      }

      return null;
    },
    "UNKNOWN_ERROR"
  );
}

export function mapUpdatePasswordErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(
    error,
    (pocketBaseError) => {
      if (pocketBaseError.status === 401 || pocketBaseError.status === 403) {
        return "UNAUTHORIZED";
      }

      if (pocketBaseError.status === 404) {
        return "NOT_FOUND";
      }

      if (pocketBaseError.status === 400) {
        if (
          hasValidationCode(
            pocketBaseError.response?.data,
            "oldPassword",
            "validation_invalid_credentials"
          ) ||
          hasValidationCode(
            pocketBaseError.response?.data,
            "oldPassword",
            "validation_invalid_old_password"
          )
        ) {
          return "INVALID_CREDENTIALS";
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
    },
    "UNKNOWN_ERROR"
  );
}

export function logAccountServiceError(context: string, error: unknown) {
  logServiceError("account-service", context, error);
}
