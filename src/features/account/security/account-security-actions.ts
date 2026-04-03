"use server";

import {
  accountDeleteInputSchema,
  accountPasswordUpdateInputSchema,
} from "@/features/account/account-schemas";
import type { AuthResponse } from "@/features/auth/auth-types";
import {
  deleteCurrentUserAccountWithPassword,
  updateCurrentUserPassword,
} from "@/server/account/account-security-service";
import { finalizeAuthAction } from "@/server/auth/auth-response";

type DeleteAccountPayload = {
  deleted: true;
};

type UpdateAccountPasswordPayload = {
  passwordUpdated: true;
};

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
