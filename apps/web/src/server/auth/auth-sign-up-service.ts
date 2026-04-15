import type { UsersRecord } from "@/types/pocketbase";
import type { SignUpPayload } from "@/features/auth/auth-types";
import type { SignUpInput } from "@/features/auth/auth-schemas";
import {
  createPocketBaseServerClient,
  exportPocketBaseAuthCookies,
} from "@/server/pocketbase/pocketbase-server";
import { formatServiceError } from "@/server/pocketbase/pocketbase-utils";
import { logAuthServiceError, mapSignUpErrorCode } from "@/server/auth/auth-errors";
import { createDisplayName } from "@/server/auth/auth-session-utils";
import type { ServerAuthResponse } from "@/server/auth/auth-response";

export async function signUpWithPassword(
  input: SignUpInput
): Promise<ServerAuthResponse<SignUpPayload>> {
  const { pb } = await createPocketBaseServerClient();
  let setCookie: string[] | undefined;
  let verificationEmailStatus: SignUpPayload["verificationEmailStatus"] = "sent";

  try {
    await pb.collection("users").create<UsersRecord>({
      email: input.email,
      password: input.password,
      passwordConfirm: input.password,
      name: createDisplayName(input.firstName, input.lastName),
    });

    try {
      await pb.collection("users").requestVerification(input.email);
    } catch (verificationError) {
      verificationEmailStatus = "needs_resend";
      console.warn(
        "[auth-service] signUpWithPassword: requestVerification failed, user was created but verification email may not have been sent",
        formatServiceError(verificationError)
      );
    }

    try {
      await pb.collection("users").authWithPassword<UsersRecord>(input.email, input.password);

      setCookie = exportPocketBaseAuthCookies(pb, {
        sessionOnly: true,
      });
    } catch (authError) {
      console.warn(
        "[auth-service] signUpWithPassword: pending auth session bootstrap failed, continuing",
        formatServiceError(authError)
      );
    }

    return {
      ok: true,
      data: {
        created: true,
        verificationEmailStatus,
      },
      ...(setCookie ? { setCookie } : {}),
    };
  } catch (error) {
    const errorCode = mapSignUpErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("signUpWithPassword", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}
