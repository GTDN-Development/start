"use server";

import type { AccountProfilePayload } from "@/features/account/account-profile";
import {
  accountAvatarUploadInputSchema,
  accountDeleteInputSchema,
  accountEmailChangeInputSchema,
  accountPasswordUpdateInputSchema,
  accountProfileInputSchema,
} from "@/features/account/account-schemas";
import type { AuthResponse } from "@/features/auth/auth-contract";
import {
  requestEmailChangeForCurrentUser,
  removeCurrentUserAvatar,
  updateCurrentUserAvatar,
  updateCurrentUserProfileName,
} from "@/server/account/account-profile-service";
import {
  deleteCurrentUserAccountWithPassword,
  updateCurrentUserPassword,
} from "@/server/account/account-security-service";
import { finalizeAuthAction } from "@/server/auth/auth-service-shared";

type DeleteAccountPayload = {
  deleted: true;
};

type RequestAccountEmailChangePayload = {
  sent: true;
};

type UpdateAccountPasswordPayload = {
  passwordUpdated: true;
};

export async function updateAccountProfileAction(input: {
  name: string;
}): Promise<AuthResponse<AccountProfilePayload>> {
  const parsedInput = accountProfileInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<AccountProfilePayload>();
  }

  const response = await updateCurrentUserProfileName(parsedInput.data.name);

  return finalizeAuthAction(response);
}

export async function uploadAccountAvatarAction(
  formData: FormData
): Promise<AuthResponse<AccountProfilePayload>> {
  const parsedInput = accountAvatarUploadInputSchema.safeParse({
    avatar: formData.get("avatar"),
  });

  if (!parsedInput.success) {
    return createBadRequestResponse<AccountProfilePayload>();
  }

  const response = await updateCurrentUserAvatar(parsedInput.data.avatar);

  return finalizeAuthAction(response);
}

export async function removeAccountAvatarAction(): Promise<AuthResponse<AccountProfilePayload>> {
  const response = await removeCurrentUserAvatar();

  return finalizeAuthAction(response);
}

export async function requestAccountEmailChangeAction(input: {
  newEmail: string;
}): Promise<AuthResponse<RequestAccountEmailChangePayload>> {
  const parsedInput = accountEmailChangeInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<RequestAccountEmailChangePayload>();
  }

  const response = await requestEmailChangeForCurrentUser(parsedInput.data.newEmail);

  return finalizeAuthAction(response);
}

export async function updateAccountPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthResponse<UpdateAccountPasswordPayload>> {
  const parsedInput = accountPasswordUpdateInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<UpdateAccountPasswordPayload>();
  }

  const response = await updateCurrentUserPassword(parsedInput.data);

  return finalizeAuthAction(response);
}

export async function deleteAccountAction(input: {
  password: string;
}): Promise<AuthResponse<DeleteAccountPayload>> {
  const parsedInput = accountDeleteInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<DeleteAccountPayload>();
  }

  const response = await deleteCurrentUserAccountWithPassword(parsedInput.data.password);

  return finalizeAuthAction(response);
}

function createBadRequestResponse<TData>(): AuthResponse<TData> {
  return {
    ok: false,
    errorCode: "BAD_REQUEST",
  };
}
