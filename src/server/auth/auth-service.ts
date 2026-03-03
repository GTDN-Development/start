import PocketBase, { ClientResponseError } from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import type {
  AuthErrorCode,
  AuthResponse,
  AuthSession,
  AuthSessionPayload,
  ResetPasswordPayload,
  AuthSignOutPayload,
  VerifyEmailPayload,
} from "@/features/auth/auth-contract";
import type { SignInInput, SignUpInput } from "@/features/auth/auth-schemas";
import {
  createClearedPocketBaseAuthCookies,
  createPocketBaseServerClient,
  exportPocketBaseAuthCookies,
} from "@/server/pocketbase/pocketbase-server";

export type ServerAuthResponse<TData> =
  | {
      ok: true;
      data: TData;
      setCookie?: string[];
    }
  | {
      ok: false;
      errorCode: AuthErrorCode;
      setCookie?: string[];
    };

export async function signInWithPassword(
  input: SignInInput
): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const { pb, hadInvalidAuthCookie } = await createPocketBaseServerClient();

  try {
    const authResponse = await pb
      .collection("users")
      .authWithPassword<UsersRecord>(input.email, input.password);

    const session = createAuthSession(pb, authResponse.record);

    if (!session) {
      return {
        ok: false,
        errorCode: "UNKNOWN_ERROR",
      };
    }

    return {
      ok: true,
      data: {
        session,
      },
      setCookie: exportPocketBaseAuthCookies(pb, {
        sessionOnly: !input.rememberMe,
      }),
    };
  } catch (error) {
    const errorCode = mapSignInErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("signInWithPassword", error);
    }

    return {
      ok: false,
      errorCode,
      ...(hadInvalidAuthCookie ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }
}

export async function signUpWithPassword(
  input: SignUpInput
): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const { pb } = await createPocketBaseServerClient();

  try {
    await pb.collection("users").create<UsersRecord>({
      email: input.email,
      password: input.password,
      passwordConfirm: input.confirmPassword,
      name: createDisplayName(input.firstName, input.lastName),
    });

    const authResponse = await pb
      .collection("users")
      .authWithPassword<UsersRecord>(input.email, input.password);

    const session = createAuthSession(pb, authResponse.record);

    if (!session) {
      return {
        ok: false,
        errorCode: "UNKNOWN_ERROR",
      };
    }

    return {
      ok: true,
      data: {
        session,
      },
      setCookie: exportPocketBaseAuthCookies(pb, {
        sessionOnly: false,
      }),
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

export async function signOutServerSession(): Promise<ServerAuthResponse<AuthSignOutPayload>> {
  await createPocketBaseServerClient();

  return {
    ok: true,
    data: {
      signedOut: true,
    },
    setCookie: createClearedPocketBaseAuthCookies(),
  };
}

export async function confirmEmailVerificationToken(
  token: string
): Promise<ServerAuthResponse<VerifyEmailPayload>> {
  const { pb, hadInvalidAuthCookie, shouldPersistSession } = await createPocketBaseServerClient();

  try {
    await pb.collection("users").confirmVerification(token);

    if (pb.authStore.isValid && isUsersRecord(pb.authStore.record)) {
      const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();
      const session = createAuthSession(pb, refreshedAuth.record);

      if (!session) {
        return {
          ok: true,
          data: {
            verified: true,
            session: null,
          },
          setCookie: createClearedPocketBaseAuthCookies(),
        };
      }

      return {
        ok: true,
        data: {
          verified: true,
          session,
        },
        setCookie: exportPocketBaseAuthCookies(pb, {
          sessionOnly: !shouldPersistSession,
        }),
      };
    }

    return {
      ok: true,
      data: {
        verified: true,
        session: null,
      },
      ...(hadInvalidAuthCookie ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  } catch (error) {
    const errorCode = mapVerifyEmailErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("confirmEmailVerificationToken", error);
    }

    return {
      ok: false,
      errorCode,
      ...(hadInvalidAuthCookie ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }
}

export async function confirmPasswordResetToken(input: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<ServerAuthResponse<ResetPasswordPayload>> {
  const { pb, hadInvalidAuthCookie } = await createPocketBaseServerClient();

  try {
    await pb
      .collection("users")
      .confirmPasswordReset(input.token, input.password, input.confirmPassword);

    return {
      ok: true,
      data: {
        passwordReset: true,
      },
      setCookie: createClearedPocketBaseAuthCookies(),
    };
  } catch (error) {
    const errorCode = mapResetPasswordErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("confirmPasswordResetToken", error);
    }

    return {
      ok: false,
      errorCode,
      ...(hadInvalidAuthCookie ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }
}

export async function getServerAuthSession(): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const { pb } = await createPocketBaseServerClient();

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return {
      ok: true,
      data: {
        session: null,
      },
    };
  }

  if (!isUsersRecord(pb.authStore.record)) {
    return {
      ok: true,
      data: {
        session: null,
      },
    };
  }

  try {
    const verifiedRecord = await pb.collection("users").getOne<UsersRecord>(pb.authStore.record.id);
    const session = createAuthSession(pb, verifiedRecord);

    if (!session) {
      return {
        ok: true,
        data: {
          session: null,
        },
      };
    }

    return {
      ok: true,
      data: {
        session,
      },
    };
  } catch (error) {
    logAuthServiceError("getServerAuthSession", error);

    return {
      ok: true,
      data: {
        session: null,
      },
    };
  }
}

export async function getApiAuthSession(): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const { pb, hasAuthCookie, hadInvalidAuthCookie, shouldPersistSession } =
    await createPocketBaseServerClient();

  if (hadInvalidAuthCookie) {
    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedPocketBaseAuthCookies(),
    };
  }

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return {
      ok: true,
      data: {
        session: null,
      },
      ...(hasAuthCookie ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
    };
  }

  if (!isUsersRecord(pb.authStore.record)) {
    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedPocketBaseAuthCookies(),
    };
  }

  try {
    const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();
    const session = createAuthSession(pb, refreshedAuth.record);

    if (!session) {
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: createClearedPocketBaseAuthCookies(),
      };
    }

    return {
      ok: true,
      data: {
        session,
      },
      setCookie: exportPocketBaseAuthCookies(pb, {
        sessionOnly: !shouldPersistSession,
      }),
    };
  } catch (error) {
    logAuthServiceError("getApiAuthSession", error);

    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedPocketBaseAuthCookies(),
    };
  }
}

function createAuthSession(pb: PocketBase, record: UsersRecord | null): AuthSession | null {
  if (!record) {
    return null;
  }

  return {
    user: {
      id: record.id,
      email: record.email,
      name: getNullableTrimmedString(record.name),
      verified: record.verified === true,
      avatarUrl: getAvatarUrl(pb, record),
    },
  };
}

function getAvatarUrl(pb: PocketBase, record: UsersRecord) {
  const avatar = getNullableTrimmedString(record.avatar);

  if (!avatar) {
    return null;
  }

  return pb.files.getURL(record, avatar);
}

function createDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function getNullableTrimmedString(value: string | null | undefined) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmedValue = value.trim();

  if (trimmedValue.length === 0) {
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

function mapSignInErrorCode(error: unknown): AuthErrorCode {
  if (error instanceof ClientResponseError) {
    if (error.status === 400 || error.status === 401 || error.status === 404) {
      return "INVALID_CREDENTIALS";
    }

    if (error.status === 429) {
      return "RATE_LIMITED";
    }
  }

  return "UNKNOWN_ERROR";
}

function mapSignUpErrorCode(error: unknown): AuthErrorCode {
  if (error instanceof ClientResponseError) {
    if (error.status === 429) {
      return "RATE_LIMITED";
    }

    if (error.status === 400) {
      if (hasValidationCode(error.response?.data, "email", "validation_not_unique")) {
        return "EMAIL_ALREADY_IN_USE";
      }

      if (hasValidationCode(error.response?.data, "password", "validation_length_out_of_range")) {
        return "WEAK_PASSWORD";
      }

      return "VALIDATION_ERROR";
    }
  }

  return "UNKNOWN_ERROR";
}

function mapVerifyEmailErrorCode(error: unknown): AuthErrorCode {
  if (error instanceof ClientResponseError) {
    if (error.status === 400 || error.status === 404) {
      return "BAD_REQUEST";
    }

    if (error.status === 429) {
      return "RATE_LIMITED";
    }
  }

  return "UNKNOWN_ERROR";
}

function mapResetPasswordErrorCode(error: unknown): AuthErrorCode {
  if (error instanceof ClientResponseError) {
    if (error.status === 429) {
      return "RATE_LIMITED";
    }

    if (error.status === 400 || error.status === 404) {
      if (hasValidationCode(error.response?.data, "password", "validation_length_out_of_range")) {
        return "WEAK_PASSWORD";
      }

      return "BAD_REQUEST";
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

function logAuthServiceError(context: string, error: unknown) {
  console.error(`[auth-service] ${context}`, formatAuthServiceError(error));
}

function formatAuthServiceError(error: unknown) {
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

export function toAuthApiResponse<TData>(response: ServerAuthResponse<TData>): AuthResponse<TData> {
  if (response.ok) {
    return {
      ok: true,
      data: response.data,
    };
  }

  return {
    ok: false,
    errorCode: response.errorCode,
  };
}
