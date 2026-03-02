import PocketBase, { ClientResponseError } from "pocketbase";
import type { UsersRecord } from "@/types/pocketbase";
import type {
  AuthErrorCode,
  AuthSession,
  AuthSessionPayload,
  AuthSignOutPayload,
  AuthResponse,
} from "@/features/auth/auth-contract";
import type { SignInInput, SignUpInput } from "@/features/auth/auth-schemas";
import {
  createClearedPocketBaseAuthCookie,
  createPocketBaseServerClient,
  exportPocketBaseAuthCookie,
} from "@/server/pocketbase/pocketbase-server";

export type ServerAuthResponse<TData> =
  | {
      ok: true;
      data: TData;
      setCookie?: string;
    }
  | {
      ok: false;
      errorCode: AuthErrorCode;
      setCookie?: string;
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
      setCookie: exportPocketBaseAuthCookie(pb, {
        sessionOnly: !input.rememberMe,
      }),
    };
  } catch (error) {
    return {
      ok: false,
      errorCode: mapSignInErrorCode(error),
      ...(hadInvalidAuthCookie ? { setCookie: createClearedPocketBaseAuthCookie() } : {}),
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
      setCookie: exportPocketBaseAuthCookie(pb),
    };
  } catch (error) {
    return {
      ok: false,
      errorCode: mapSignUpErrorCode(error),
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
    setCookie: createClearedPocketBaseAuthCookie(),
  };
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
  } catch {
    return {
      ok: true,
      data: {
        session: null,
      },
    };
  }
}

export async function getApiAuthSession(): Promise<ServerAuthResponse<AuthSessionPayload>> {
  const { pb, hasAuthCookie, hadInvalidAuthCookie } = await createPocketBaseServerClient();

  if (hadInvalidAuthCookie) {
    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedPocketBaseAuthCookie(),
    };
  }

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return {
      ok: true,
      data: {
        session: null,
      },
      ...(hasAuthCookie ? { setCookie: createClearedPocketBaseAuthCookie() } : {}),
    };
  }

  if (!isUsersRecord(pb.authStore.record)) {
    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedPocketBaseAuthCookie(),
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
        setCookie: createClearedPocketBaseAuthCookie(),
      };
    }

    return {
      ok: true,
      data: {
        session,
      },
      setCookie: exportPocketBaseAuthCookie(pb),
    };
  } catch {
    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedPocketBaseAuthCookie(),
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
