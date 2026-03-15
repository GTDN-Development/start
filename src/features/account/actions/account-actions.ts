"use server";

import { z } from "zod";
import type { AccountProfilePayload } from "@/features/account/account-profile";
import type { AuthResponse } from "@/features/auth/auth-contract";
import { accountConfig } from "@/config/account";
import {
  authPasswordSchema,
  normalizedEmailSchema,
  refinePasswordMatch,
  requiredPasswordSchema,
} from "@/lib/schemas";
import {
  deleteCurrentUserAccountWithPassword,
  removeCurrentUserAvatar,
  requestEmailChangeForCurrentUser,
  updateCurrentUserAvatar,
  updateCurrentUserPassword,
  updateCurrentUserProfileName,
} from "@/server/account/account-service";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import { toAuthApiResponse, type ServerAuthResponse } from "@/server/auth/auth-service";

type DeleteAccountPayload = {
  deleted: true;
};

type RequestAccountEmailChangePayload = {
  sent: true;
};

type UpdateAccountPasswordPayload = {
  passwordUpdated: true;
};

const MAX_ACCOUNT_PROFILE_NAME_LENGTH = accountConfig.limits.profileNameMaxLength;

const updateProfileInputSchema = z.object({
  name: z.string().trim().max(MAX_ACCOUNT_PROFILE_NAME_LENGTH),
});

const uploadAvatarInputSchema = z.object({
  avatar: z.custom<File>((value) => value instanceof File),
});

const requestEmailChangeInputSchema = z.object({
  newEmail: normalizedEmailSchema(),
});

const updatePasswordInputSchema = z
  .object({
    currentPassword: requiredPasswordSchema(),
    newPassword: authPasswordSchema(),
    confirmPassword: authPasswordSchema(),
  })
  .superRefine(
    refinePasswordMatch<{
      currentPassword: string;
      newPassword: string;
      confirmPassword: string;
    }>({
      passwordField: "newPassword",
    })
  );

const deleteAccountInputSchema = z.object({
  password: requiredPasswordSchema(),
});

export async function updateAccountProfileAction(input: {
  name: string;
}): Promise<AuthResponse<AccountProfilePayload>> {
  const parsedInput = updateProfileInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<AccountProfilePayload>();
  }

  const response = await updateCurrentUserProfileName(parsedInput.data.name);

  return finalizeAccountAction(response);
}

export async function uploadAccountAvatarAction(
  formData: FormData
): Promise<AuthResponse<AccountProfilePayload>> {
  const parsedInput = uploadAvatarInputSchema.safeParse({
    avatar: formData.get("avatar"),
  });

  if (!parsedInput.success) {
    return createBadRequestResponse<AccountProfilePayload>();
  }

  const response = await updateCurrentUserAvatar(parsedInput.data.avatar);

  return finalizeAccountAction(response);
}

export async function removeAccountAvatarAction(): Promise<AuthResponse<AccountProfilePayload>> {
  const response = await removeCurrentUserAvatar();

  return finalizeAccountAction(response);
}

export async function requestAccountEmailChangeAction(input: {
  newEmail: string;
}): Promise<AuthResponse<RequestAccountEmailChangePayload>> {
  const parsedInput = requestEmailChangeInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<RequestAccountEmailChangePayload>();
  }

  const response = await requestEmailChangeForCurrentUser(parsedInput.data.newEmail);

  return finalizeAccountAction(response);
}

export async function updateAccountPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthResponse<UpdateAccountPasswordPayload>> {
  const parsedInput = updatePasswordInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<UpdateAccountPasswordPayload>();
  }

  const response = await updateCurrentUserPassword(parsedInput.data);

  return finalizeAccountAction(response);
}

export async function deleteAccountAction(input: {
  password: string;
}): Promise<AuthResponse<DeleteAccountPayload>> {
  const parsedInput = deleteAccountInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<DeleteAccountPayload>();
  }

  const response = await deleteCurrentUserAccountWithPassword(parsedInput.data.password);

  return finalizeAccountAction(response);
}

async function finalizeAccountAction<TData>(
  response: ServerAuthResponse<TData>
): Promise<AuthResponse<TData>> {
  await applyServerAuthCookies(response.setCookie);

  return toAuthApiResponse(response);
}

function createBadRequestResponse<TData>(): AuthResponse<TData> {
  return {
    ok: false,
    errorCode: "BAD_REQUEST",
  };
}
