import PocketBase from "pocketbase";
import type { AccountProfilePayload } from "@/features/account/account-profile";
import type { AuthErrorCode } from "@/features/auth/auth-contract";
import type { UsersRecord } from "@/types/pocketbase";
import type { ServerAuthResponse } from "@/server/auth/auth-service";
import {
  createClearedPocketBaseAuthCookies,
  createPocketBaseServerClient,
} from "@/server/pocketbase/pocketbase-server";
import {
  getAvatarUrl,
  getNullableTrimmedString,
  hasValidationCode,
  isUsersRecord,
  logServiceError,
  mapPocketBaseError,
} from "@/server/pocketbase/pocketbase-utils";

const MAX_ACCOUNT_PROFILE_NAME_LENGTH = 32;
const MAX_ACCOUNT_AVATAR_FILE_SIZE_BYTES = 1024 * 1024;

type DeleteAccountPayload = {
  deleted: true;
};

type UpdateAccountPasswordPayload = {
  passwordUpdated: true;
};

type RequestAccountEmailChangePayload = {
  sent: true;
};

type RequireCurrentUserResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
    }
  | {
      ok: false;
      response: ServerAuthResponse<never>;
    };

export async function updateCurrentUserProfileName(
  name: string
): Promise<ServerAuthResponse<AccountProfilePayload>> {
  const normalizedName = normalizeProfileName(name);

  if (normalizedName && normalizedName.length > MAX_ACCOUNT_PROFILE_NAME_LENGTH) {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
    };
  }

  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const updatedRecord = await currentUser.pb
      .collection("users")
      .update<UsersRecord>(currentUser.user.id, {
        name: normalizedName ?? "",
      });

    return {
      ok: true,
      data: {
        profile: createAccountProfileSnapshot(currentUser.pb, updatedRecord),
      },
    };
  } catch (error) {
    const errorCode = mapUpdateProfileErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAccountServiceError("updateCurrentUserProfileName", error);
    }

    return {
      ok: false,
      errorCode,
      ...(errorCode === "UNAUTHORIZED" ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }
}

export async function updateCurrentUserAvatar(
  avatarFile: File
): Promise<ServerAuthResponse<AccountProfilePayload>> {
  if (!avatarFile.type.startsWith("image/")) {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
    };
  }

  if (avatarFile.size > MAX_ACCOUNT_AVATAR_FILE_SIZE_BYTES) {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
    };
  }

  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const updatedRecord = await currentUser.pb
      .collection("users")
      .update<UsersRecord>(currentUser.user.id, {
        avatar: avatarFile,
      });

    return {
      ok: true,
      data: {
        profile: createAccountProfileSnapshot(currentUser.pb, updatedRecord),
      },
    };
  } catch (error) {
    const errorCode = mapUpdateProfileErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAccountServiceError("updateCurrentUserAvatar", error);
    }

    return {
      ok: false,
      errorCode,
      ...(errorCode === "UNAUTHORIZED" ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }
}

export async function removeCurrentUserAvatar(): Promise<
  ServerAuthResponse<AccountProfilePayload>
> {
  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const updatedRecord = await currentUser.pb
      .collection("users")
      .update<UsersRecord>(currentUser.user.id, {
        avatar: null,
      });

    return {
      ok: true,
      data: {
        profile: createAccountProfileSnapshot(currentUser.pb, updatedRecord),
      },
    };
  } catch (error) {
    const errorCode = mapUpdateProfileErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAccountServiceError("removeCurrentUserAvatar", error);
    }

    return {
      ok: false,
      errorCode,
      ...(errorCode === "UNAUTHORIZED" ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }
}

export async function requestEmailChangeForCurrentUser(
  newEmail: string
): Promise<ServerAuthResponse<RequestAccountEmailChangePayload>> {
  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    await currentUser.pb.collection("users").requestEmailChange(newEmail);

    return {
      ok: true,
      data: {
        sent: true,
      },
    };
  } catch (error) {
    const errorCode = mapRequestEmailChangeErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAccountServiceError("requestEmailChangeForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
      ...(errorCode === "UNAUTHORIZED" ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }
}

export async function deleteCurrentUserAccountWithPassword(
  password: string
): Promise<ServerAuthResponse<DeleteAccountPayload>> {
  if (!password.trim()) {
    return {
      ok: false,
      errorCode: "BAD_REQUEST",
    };
  }

  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    await currentUser.pb
      .collection("users")
      .authWithPassword<UsersRecord>(currentUser.user.email, password);
  } catch (error) {
    const errorCode = mapDeleteAccountPasswordErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAccountServiceError("deleteCurrentUserAccountWithPassword.verifyPassword", error);
    }

    return {
      ok: false,
      errorCode,
      ...(errorCode === "UNAUTHORIZED" ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }

  try {
    await currentUser.pb.collection("users").delete(currentUser.user.id);

    return {
      ok: true,
      data: {
        deleted: true,
      },
      setCookie: createClearedPocketBaseAuthCookies(),
    };
  } catch (error) {
    const errorCode = mapDeleteAccountErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAccountServiceError("deleteCurrentUserAccountWithPassword.delete", error);
    }

    return {
      ok: false,
      errorCode,
      ...(errorCode === "UNAUTHORIZED" ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }
}

export async function updateCurrentUserPassword(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ServerAuthResponse<UpdateAccountPasswordPayload>> {
  if (!input.currentPassword.trim() || !input.newPassword.trim() || !input.confirmPassword.trim()) {
    return {
      ok: false,
      errorCode: "BAD_REQUEST",
    };
  }

  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    await currentUser.pb.collection("users").update<UsersRecord>(currentUser.user.id, {
      oldPassword: input.currentPassword,
      password: input.newPassword,
      passwordConfirm: input.confirmPassword,
    });

    return {
      ok: true,
      data: {
        passwordUpdated: true,
      },
    };
  } catch (error) {
    const errorCode = mapUpdatePasswordErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAccountServiceError("updateCurrentUserPassword", error);
    }

    return {
      ok: false,
      errorCode,
      ...(errorCode === "UNAUTHORIZED" ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }
}

async function requireCurrentUser(): Promise<RequireCurrentUserResult> {
  const { pb, hasAuthCookie, hadInvalidAuthCookie } = await createPocketBaseServerClient();

  if (hadInvalidAuthCookie) {
    return {
      ok: false,
      response: {
        ok: false,
        errorCode: "UNAUTHORIZED",
        setCookie: createClearedPocketBaseAuthCookies(),
      },
    };
  }

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return {
      ok: false,
      response: {
        ok: false,
        errorCode: "UNAUTHORIZED",
        ...(hasAuthCookie ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
      },
    };
  }

  if (!isUsersRecord(pb.authStore.record)) {
    return {
      ok: false,
      response: {
        ok: false,
        errorCode: "UNAUTHORIZED",
        setCookie: createClearedPocketBaseAuthCookies(),
      },
    };
  }

  return {
    ok: true,
    pb,
    user: pb.authStore.record,
  };
}

function normalizeProfileName(value: string) {
  const trimmedValue = value.trim();

  return trimmedValue.length > 0 ? trimmedValue : null;
}

function createAccountProfileSnapshot(pb: PocketBase, record: UsersRecord) {
  return {
    email: record.email,
    name: getNullableTrimmedString(record.name),
    verified: record.verified === true,
    avatarUrl: getAvatarUrl(pb, record),
  };
}

function mapUpdateProfileErrorCode(error: unknown): AuthErrorCode {
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

function mapRequestEmailChangeErrorCode(error: unknown): AuthErrorCode {
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

function mapDeleteAccountPasswordErrorCode(error: unknown): AuthErrorCode {
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

function mapDeleteAccountErrorCode(error: unknown): AuthErrorCode {
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

function mapUpdatePasswordErrorCode(error: unknown): AuthErrorCode {
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

function logAccountServiceError(context: string, error: unknown) {
  logServiceError("account-service", context, error);
}
