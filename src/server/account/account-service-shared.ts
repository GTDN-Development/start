import type PocketBase from "pocketbase";
import type { AccountProfilePayload } from "@/features/account/account-profile";
import type { AuthErrorCode } from "@/features/auth/auth-contract";
import type { UsersRecord } from "@/types/pocketbase";
import { accountConfig } from "@/config/account";
import { requireCurrentUser as requireAuthenticatedUser } from "@/server/auth/current-user";
import { createClearedAuthAndDeviceCookies } from "@/server/device-sessions/device-sessions-cookie";
import type { ServerAuthResponse } from "@/server/auth/auth-service-shared";
import {
  getAvatarUrl,
  getNullableTrimmedString,
  hasValidationCode,
  logServiceError,
  mapPocketBaseError,
} from "@/server/pocketbase/pocketbase-utils";

export type DeleteAccountPayload = {
  deleted: true;
};

export type UpdateAccountPasswordPayload = {
  passwordUpdated: true;
};

export type RequestAccountEmailChangePayload = {
  sent: true;
};

export const MAX_ACCOUNT_PROFILE_NAME_LENGTH = accountConfig.limits.profileNameMaxLength;
export const MAX_ACCOUNT_AVATAR_SIZE_BYTES = accountConfig.limits.avatarMaxSizeBytes;

export type RequireCurrentAccountUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
      currentSessionIdHash: string;
    }
  | {
      ok: false;
      response: ServerAuthResponse<never>;
    };

export async function requireCurrentAccountUser(): Promise<RequireCurrentAccountUserResult> {
  const currentUser = await requireAuthenticatedUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      response: {
        ok: false,
        errorCode: currentUser.errorCode,
        ...(currentUser.setCookie ? { setCookie: currentUser.setCookie } : {}),
      },
    };
  }

  return {
    ok: true,
    pb: currentUser.pb,
    user: currentUser.user,
    currentSessionIdHash: currentUser.currentSessionIdHash,
  };
}

export function normalizeProfileName(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

export function createAccountProfileSnapshot(pb: PocketBase, record: UsersRecord) {
  return {
    id: record.id,
    email: record.email,
    name: getNullableTrimmedString(record.name),
    avatarUrl: getAvatarUrl(pb, record),
  };
}

export function getUnauthorizedAccountCookies(errorCode: AuthErrorCode) {
  if (errorCode !== "UNAUTHORIZED") {
    return {};
  }

  return {
    setCookie: createClearedAuthAndDeviceCookies(),
  };
}

export function mapUpdateProfileErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
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
  });
}

export function mapRequestEmailChangeErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
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
  });
}

export function mapDeleteAccountPasswordErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
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
  });
}

export function mapDeleteAccountErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
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
  });
}

export function mapUpdatePasswordErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
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
  });
}

export function logAccountServiceError(context: string, error: unknown) {
  logServiceError("account-service", context, error);
}
