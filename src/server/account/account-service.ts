import PocketBase, { ClientResponseError } from "pocketbase";
import type { AccountProfilePayload } from "@/features/account/account-profile";
import type { AuthErrorCode } from "@/features/auth/auth-contract";
import type { UsersRecord } from "@/types/pocketbase";
import type { ServerAuthResponse } from "@/server/auth/auth-service";
import {
  createClearedPocketBaseAuthCookies,
  createPocketBaseServerClient,
} from "@/server/pocketbase/pocketbase-server";

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

function getAvatarUrl(pb: PocketBase, record: UsersRecord) {
  const avatar = getNullableTrimmedString(record.avatar);

  if (!avatar) {
    return null;
  }

  return pb.files.getURL(record, avatar);
}

function getNullableTrimmedString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  return trimmedValue;
}

function isUsersRecord(value: unknown): value is UsersRecord {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Partial<UsersRecord>;

  return typeof record.id === "string" && typeof record.email === "string";
}

function mapUpdateProfileErrorCode(error: unknown): AuthErrorCode {
  if (error instanceof ClientResponseError) {
    if (error.status === 401 || error.status === 403) {
      return "UNAUTHORIZED";
    }

    if (error.status === 404) {
      return "NOT_FOUND";
    }

    if (error.status === 429) {
      return "RATE_LIMITED";
    }

    if (error.status === 400) {
      return "VALIDATION_ERROR";
    }
  }

  return "UNKNOWN_ERROR";
}

function mapRequestEmailChangeErrorCode(error: unknown): AuthErrorCode {
  if (error instanceof ClientResponseError) {
    if (error.status === 401 || error.status === 403) {
      return "UNAUTHORIZED";
    }

    if (error.status === 404) {
      return "NOT_FOUND";
    }

    if (error.status === 429) {
      return "RATE_LIMITED";
    }

    if (error.status === 400) {
      if (
        hasValidationCode(error.response?.data, "newEmail", "validation_not_unique") ||
        hasValidationCode(error.response?.data, "email", "validation_not_unique")
      ) {
        return "EMAIL_ALREADY_IN_USE";
      }

      return "VALIDATION_ERROR";
    }
  }

  return "UNKNOWN_ERROR";
}

function mapDeleteAccountPasswordErrorCode(error: unknown): AuthErrorCode {
  if (error instanceof ClientResponseError) {
    if (error.status === 400 || error.status === 401 || error.status === 404) {
      return "INVALID_CREDENTIALS";
    }

    if (error.status === 403) {
      return "UNAUTHORIZED";
    }

    if (error.status === 429) {
      return "RATE_LIMITED";
    }
  }

  return "UNKNOWN_ERROR";
}

function mapDeleteAccountErrorCode(error: unknown): AuthErrorCode {
  if (error instanceof ClientResponseError) {
    if (error.status === 401) {
      return "UNAUTHORIZED";
    }

    if (error.status === 403 || error.status === 400) {
      return "BAD_REQUEST";
    }

    if (error.status === 404) {
      return "NOT_FOUND";
    }

    if (error.status === 429) {
      return "RATE_LIMITED";
    }
  }

  return "UNKNOWN_ERROR";
}

function mapUpdatePasswordErrorCode(error: unknown): AuthErrorCode {
  if (error instanceof ClientResponseError) {
    if (error.status === 401 || error.status === 403) {
      return "UNAUTHORIZED";
    }

    if (error.status === 404) {
      return "NOT_FOUND";
    }

    if (error.status === 429) {
      return "RATE_LIMITED";
    }

    if (error.status === 400) {
      if (
        hasValidationCode(error.response?.data, "oldPassword", "validation_invalid_credentials") ||
        hasValidationCode(error.response?.data, "oldPassword", "validation_invalid_old_password")
      ) {
        return "INVALID_CREDENTIALS";
      }

      if (hasValidationCode(error.response?.data, "password", "validation_length_out_of_range")) {
        return "WEAK_PASSWORD";
      }

      return "VALIDATION_ERROR";
    }
  }

  return "UNKNOWN_ERROR";
}

function hasValidationCode(data: unknown, field: string, expectedCode: string) {
  const fieldError = getFieldError(data, field);

  return fieldError?.code === expectedCode;
}

function getFieldError(data: unknown, field: string): { code?: string } | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const dataRecord = data as Record<string, unknown>;
  const fieldValue = dataRecord[field];

  if (!fieldValue || typeof fieldValue !== "object") {
    return null;
  }

  return fieldValue as { code?: string };
}

function logAccountServiceError(context: string, error: unknown) {
  console.error(`[account-service] ${context}`, formatAccountServiceError(error));
}

function formatAccountServiceError(error: unknown) {
  if (error instanceof ClientResponseError) {
    return {
      type: "ClientResponseError",
      status: error.status,
      url: error.url,
      message: error.message,
    };
  }

  if (error instanceof Error) {
    return {
      type: error.name,
      message: error.message,
    };
  }

  return {
    type: "UnknownError",
    message: "Non-error value thrown",
  };
}
