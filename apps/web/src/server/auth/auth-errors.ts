import { ClientResponseError } from "pocketbase";
import type { AuthErrorCode } from "@/features/auth/auth-types";
import {
  hasValidationCode,
  logServiceError,
  mapPocketBaseError,
} from "@/server/pocketbase/pocketbase-utils";

export function mapSignInErrorCode(error: unknown): AuthErrorCode {
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

      return null;
    },
    "UNKNOWN_ERROR"
  );
}

export function mapSignUpErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(
    error,
    (pocketBaseError) => {
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
    },
    "UNKNOWN_ERROR"
  );
}

export function mapVerifyEmailErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(
    error,
    (pocketBaseError) => {
      if (pocketBaseError.status === 400 || pocketBaseError.status === 404) {
        return "BAD_REQUEST";
      }

      return null;
    },
    "UNKNOWN_ERROR"
  );
}

export function mapResetPasswordErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(
    error,
    (pocketBaseError) => {
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
    },
    "UNKNOWN_ERROR"
  );
}

export function mapConfirmEmailChangeErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(
    error,
    (pocketBaseError) => {
      if (pocketBaseError.status === 401 || pocketBaseError.status === 403) {
        return "UNAUTHORIZED";
      }

      if (pocketBaseError.status === 400 || pocketBaseError.status === 404) {
        return "BAD_REQUEST";
      }

      return null;
    },
    "UNKNOWN_ERROR"
  );
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
