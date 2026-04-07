"use server";

import type { AccountProfilePayload } from "@/features/account/account-profile-types";
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
import { finalizeAuthAction } from "@/server/auth/auth-response";

type RequestAccountEmailChangePayload = {
  sent: true;
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

function createBadRequestResponse<TData>(): AuthResponse<TData> {
  return {
    ok: false,
    errorCode: "BAD_REQUEST",
  };
}
