"use server";

import type { AccountProfileSnapshot } from "@/features/account/account-profile-types";
import type { AuthResponse } from "@/features/auth/auth-types";
import {
  accountAvatarUploadInputSchema,
  accountEmailChangeInputSchema,
  accountProfileInputSchema,
} from "@/features/account/account-schemas";
import {
  requestEmailChangeForCurrentUser,
  removeCurrentUserAvatar,
  updateCurrentUserAvatar,
  updateCurrentUserProfileName,
} from "@/server/account/account-profile-service";
import { createBadRequestAuthResponse, finalizeAuthAction } from "@/server/auth/auth-response";

type RequestAccountEmailChangePayload = {
  sent: true;
};

export async function updateAccountProfileAction(input: {
  name: string;
}): Promise<AuthResponse<AccountProfileSnapshot>> {
  const parsedInput = accountProfileInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestAuthResponse<AccountProfileSnapshot>();
  }

  const response = await updateCurrentUserProfileName(parsedInput.data.name);

  return finalizeAuthAction(response);
}

export async function uploadAccountAvatarAction(
  formData: FormData
): Promise<AuthResponse<AccountProfileSnapshot>> {
  const parsedInput = accountAvatarUploadInputSchema.safeParse({
    avatar: formData.get("avatar"),
  });

  if (!parsedInput.success) {
    return createBadRequestAuthResponse<AccountProfileSnapshot>();
  }

  const response = await updateCurrentUserAvatar(parsedInput.data.avatar);

  return finalizeAuthAction(response);
}

export async function removeAccountAvatarAction(): Promise<AuthResponse<AccountProfileSnapshot>> {
  const response = await removeCurrentUserAvatar();

  return finalizeAuthAction(response);
}

export async function requestAccountEmailChangeAction(input: {
  newEmail: string;
}): Promise<AuthResponse<RequestAccountEmailChangePayload>> {
  const parsedInput = accountEmailChangeInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestAuthResponse<RequestAccountEmailChangePayload>();
  }

  const response = await requestEmailChangeForCurrentUser(parsedInput.data.newEmail);

  return finalizeAuthAction(response);
}
