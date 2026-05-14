import type { AccountProfileSnapshot } from "@/features/account/account-profile-types";
import type { UsersRecord } from "@/types/pocketbase";
import type { ServerAuthResponse } from "@/server/auth/auth-response";
import {
  createAccountProfileSnapshot,
  MAX_ACCOUNT_AVATAR_SIZE_BYTES,
  MAX_ACCOUNT_PROFILE_NAME_LENGTH,
  normalizeProfileName,
} from "@/server/account/account-profile-utils";
import {
  getUnauthorizedAccountCookies,
  logAccountServiceError,
  mapRequestEmailChangeErrorCode,
  mapUpdateProfileErrorCode,
} from "@/server/account/account-errors";
import { requireCurrentWritableUser } from "@/server/auth/auth-session-service";
import { accountConfig } from "@/config/account";

type RequestAccountEmailChangePayload = {
  sent: true;
};

export async function updateCurrentUserProfileName(
  name: string
): Promise<ServerAuthResponse<AccountProfileSnapshot>> {
  const normalizedName = normalizeProfileName(name);

  if (normalizedName && normalizedName.length > MAX_ACCOUNT_PROFILE_NAME_LENGTH) {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
    };
  }

  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.cookieMutations ? { cookieMutations: currentUser.cookieMutations } : {}),
    };
  }

  try {
    const updatedRecord = await currentUser.pb
      .collection("users")
      .update<UsersRecord>(currentUser.user.id, {
        name: normalizedName ?? "",
      });

    return {
      ok: true,
      data: createAccountProfileSnapshot(currentUser.pb, updatedRecord),
    };
  } catch (error) {
    const errorCode = mapUpdateProfileErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAccountServiceError("updateCurrentUserProfileName", error);
    }

    return {
      ok: false,
      errorCode,
      ...getUnauthorizedAccountCookies(errorCode),
    };
  }
}

export async function updateCurrentUserAvatar(
  avatarFile: File
): Promise<ServerAuthResponse<AccountProfileSnapshot>> {
  if (!accountConfig.avatar.allowedMimeTypes.includes(avatarFile.type)) {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
    };
  }

  if (avatarFile.size > MAX_ACCOUNT_AVATAR_SIZE_BYTES) {
    return {
      ok: false,
      errorCode: "VALIDATION_ERROR",
    };
  }

  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.cookieMutations ? { cookieMutations: currentUser.cookieMutations } : {}),
    };
  }

  try {
    const updatedRecord = await currentUser.pb
      .collection("users")
      .update<UsersRecord>(currentUser.user.id, {
        avatar: avatarFile,
      });

    return {
      ok: true,
      data: createAccountProfileSnapshot(currentUser.pb, updatedRecord),
    };
  } catch (error) {
    const errorCode = mapUpdateProfileErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAccountServiceError("updateCurrentUserAvatar", error);
    }

    return {
      ok: false,
      errorCode,
      ...getUnauthorizedAccountCookies(errorCode),
    };
  }
}

export async function removeCurrentUserAvatar(): Promise<
  ServerAuthResponse<AccountProfileSnapshot>
> {
  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.cookieMutations ? { cookieMutations: currentUser.cookieMutations } : {}),
    };
  }

  try {
    const updatedRecord = await currentUser.pb
      .collection("users")
      .update<UsersRecord>(currentUser.user.id, {
        avatar: null,
      });

    return {
      ok: true,
      data: createAccountProfileSnapshot(currentUser.pb, updatedRecord),
    };
  } catch (error) {
    const errorCode = mapUpdateProfileErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAccountServiceError("removeCurrentUserAvatar", error);
    }

    return {
      ok: false,
      errorCode,
      ...getUnauthorizedAccountCookies(errorCode),
    };
  }
}

export async function requestEmailChangeForCurrentUser(
  newEmail: string
): Promise<ServerAuthResponse<RequestAccountEmailChangePayload>> {
  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.cookieMutations ? { cookieMutations: currentUser.cookieMutations } : {}),
    };
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
      ...getUnauthorizedAccountCookies(errorCode),
    };
  }
}
