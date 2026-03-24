"use server";

import { z } from "zod";
import type { SettingsProfilePayload } from "@/features/settings/settings-profile";
import type { AuthResponse } from "@/features/auth/auth-contract";
import { settingsConfig } from "@/config/settings";
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
} from "@/server/settings/settings-service";
import { finalizeAuthAction } from "@/server/auth/auth-service";

type DeleteAccountPayload = {
  deleted: true;
};

type RequestAccountEmailChangePayload = {
  sent: true;
};

type UpdateAccountPasswordPayload = {
  passwordUpdated: true;
};

const MAX_SETTINGS_PROFILE_NAME_LENGTH = settingsConfig.limits.profileNameMaxLength;

const updateProfileInputSchema = z.object({
  name: z.string().trim().max(MAX_SETTINGS_PROFILE_NAME_LENGTH),
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

export async function updateSettingsProfileAction(input: {
  name: string;
}): Promise<AuthResponse<SettingsProfilePayload>> {
  const parsedInput = updateProfileInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<SettingsProfilePayload>();
  }

  const response = await updateCurrentUserProfileName(parsedInput.data.name);

  return finalizeAuthAction(response);
}

export async function uploadSettingsAvatarAction(
  formData: FormData
): Promise<AuthResponse<SettingsProfilePayload>> {
  const parsedInput = uploadAvatarInputSchema.safeParse({
    avatar: formData.get("avatar"),
  });

  if (!parsedInput.success) {
    return createBadRequestResponse<SettingsProfilePayload>();
  }

  const response = await updateCurrentUserAvatar(parsedInput.data.avatar);

  return finalizeAuthAction(response);
}

export async function removeSettingsAvatarAction(): Promise<AuthResponse<SettingsProfilePayload>> {
  const response = await removeCurrentUserAvatar();

  return finalizeAuthAction(response);
}

export async function requestSettingsEmailChangeAction(input: {
  newEmail: string;
}): Promise<AuthResponse<RequestAccountEmailChangePayload>> {
  const parsedInput = requestEmailChangeInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<RequestAccountEmailChangePayload>();
  }

  const response = await requestEmailChangeForCurrentUser(parsedInput.data.newEmail);

  return finalizeAuthAction(response);
}

export async function updateSettingsPasswordAction(input: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<AuthResponse<UpdateAccountPasswordPayload>> {
  const parsedInput = updatePasswordInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse<UpdateAccountPasswordPayload>();
  }

  const response = await updateCurrentUserPassword(parsedInput.data);

  return finalizeAuthAction(response);
}

export async function deleteAccountAction(input: {
  password: string;
}): Promise<AuthResponse<DeleteAccountPayload>> {
  const parsedInput = deleteAccountInputSchema.safeParse(input);

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
