import PocketBase, { ClientResponseError } from "pocketbase";
import { headers } from "next/headers";
import type { UsersRecord } from "@/types/pocketbase";
import type {
  AuthErrorCode,
  AuthResponse,
  ConfirmEmailChangePayload,
  AuthSession,
  AuthSessionPayload,
  RequestEmailVerificationPayload,
  RequestPasswordResetPayload,
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
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import {
  createClearedAuthAndDeviceCookies,
  generateDeviceSessionCookie,
  readDeviceSessionCookie,
} from "@/server/device-sessions/device-sessions-cookie";
import {
  hashSessionToken,
  registerOrRefreshDeviceSession,
  revokeCurrentDeviceSession,
  validateDeviceSessionOrInvalidate,
} from "@/server/device-sessions/device-sessions-service";
import { requireCurrentUser as requireAuthenticatedUser } from "@/server/auth/current-user";
import {
  formatServiceError,
  getAvatarUrl,
  getNullableTrimmedString,
  hasValidationCode,
  isUsersRecord,
  logServiceError,
  mapPocketBaseError,
} from "@/server/pocketbase/pocketbase-utils";

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

    const { token: deviceSessionToken, setCookie: deviceSessionCookie } =
      generateDeviceSessionCookie(input.rememberMe);

    try {
      const requestHeaders = await headers();
      await registerOrRefreshDeviceSession({
        pb,
        userId: session.user.id,
        sessionToken: deviceSessionToken,
        rememberMe: input.rememberMe,
        requestHeaders,
      });
    } catch (error) {
      console.warn(
        "[auth-service] signInWithPassword: device session registration failed, continuing",
        formatServiceError(error)
      );
    }

    return {
      ok: true,
      data: {
        session,
      },
      setCookie: [
        ...exportPocketBaseAuthCookies(pb, {
          sessionOnly: !input.rememberMe,
        }),
        deviceSessionCookie,
      ],
    };
  } catch (error) {
    const errorCode = mapSignInErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("signInWithPassword", error);
    }

    return {
      ok: false,
      errorCode,
      ...(hadInvalidAuthCookie ? { setCookie: createClearedAuthAndDeviceCookies() } : {}),
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

    // Explicitly request verification email as a safety net.
    // PocketBase auto-sends on create only when the collection setting is enabled AND SMTP works.
    // This ensures delivery even if the auto-send was skipped or silently failed.
    try {
      await pb.collection("users").requestVerification(input.email);
    } catch (verificationError) {
      console.warn(
        "[auth-service] signUpWithPassword: requestVerification failed, user was created but verification email may not have been sent",
        formatServiceError(verificationError)
      );
    }

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

    const { token: deviceSessionToken, setCookie: deviceSessionCookie } =
      generateDeviceSessionCookie(true);

    try {
      const requestHeaders = await headers();
      await registerOrRefreshDeviceSession({
        pb,
        userId: session.user.id,
        sessionToken: deviceSessionToken,
        rememberMe: true,
        requestHeaders,
      });
    } catch (error) {
      console.warn(
        "[auth-service] signUpWithPassword: device session registration failed, continuing",
        formatServiceError(error)
      );
    }

    return {
      ok: true,
      data: {
        session,
      },
      setCookie: [
        ...exportPocketBaseAuthCookies(pb, {
          sessionOnly: false,
        }),
        deviceSessionCookie,
      ],
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
  const { pb } = await createPocketBaseServerClient();

  const deviceSessionToken = await readDeviceSessionCookie();

  if (deviceSessionToken && pb.authStore.isValid && isUsersRecord(pb.authStore.record)) {
    try {
      await revokeCurrentDeviceSession({
        pb,
        userId: pb.authStore.record.id,
        currentSessionIdHash: hashSessionToken(deviceSessionToken),
      });
    } catch (error) {
      console.warn(
        "[auth-service] signOutServerSession: device session revoke failed, continuing",
        formatServiceError(error)
      );
    }
  }

  return {
    ok: true,
    data: {
      signedOut: true,
    },
    setCookie: createClearedAuthAndDeviceCookies(),
  };
}

export async function confirmEmailVerificationToken(
  token: string
): Promise<ServerAuthResponse<VerifyEmailPayload>> {
  const { pb, hadInvalidAuthCookie, shouldPersistSession } = await createPocketBaseServerClient();
  const hadUnverifiedAuthenticatedSession =
    pb.authStore.isValid &&
    isUsersRecord(pb.authStore.record) &&
    pb.authStore.record.verified !== true;

  try {
    await pb.collection("users").confirmVerification(token);

    const confirmedSessionResponse = await getVerifiedSessionResponse(pb, shouldPersistSession);

    if (confirmedSessionResponse) {
      return confirmedSessionResponse;
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
    if (mapVerifyEmailErrorCode(error) === "BAD_REQUEST" && hadUnverifiedAuthenticatedSession) {
      const verifiedAfterRetryResponse = await getVerifiedSessionResponse(pb, shouldPersistSession);

      if (verifiedAfterRetryResponse) {
        return verifiedAfterRetryResponse;
      }
    }

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

async function getVerifiedSessionResponse(
  pb: PocketBase,
  shouldPersistSession: boolean
): Promise<ServerAuthResponse<VerifyEmailPayload> | null> {
  if (!pb.authStore.isValid || !isUsersRecord(pb.authStore.record)) {
    return null;
  }

  try {
    const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();

    if (refreshedAuth.record.verified !== true) {
      return null;
    }

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
  } catch (error) {
    if (
      error instanceof ClientResponseError &&
      (error.status === 400 || error.status === 401 || error.status === 403 || error.status === 404)
    ) {
      return null;
    }

    throw error;
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

export async function requestPasswordResetForEmail(
  email: string
): Promise<ServerAuthResponse<RequestPasswordResetPayload>> {
  const { pb } = await createPocketBaseServerClient();

  try {
    await pb.collection("users").requestPasswordReset(email);
  } catch (error) {
    // Always return success to prevent email enumeration.
    // Only propagate rate-limiting so the UI can inform the user.
    if (error instanceof ClientResponseError && error.status === 429) {
      return {
        ok: false,
        errorCode: "RATE_LIMITED",
      };
    }

    // Log unexpected errors but still return success to the client.
    if (!(error instanceof ClientResponseError) || (error.status !== 400 && error.status !== 404)) {
      logAuthServiceError("requestPasswordResetForEmail", error);
    }
  }

  return {
    ok: true,
    data: {
      sent: true,
    },
  };
}

export async function requestEmailVerificationForCurrentUser(): Promise<
  ServerAuthResponse<RequestEmailVerificationPayload>
> {
  const currentUser = await requireAuthenticatedUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.setCookie ? { setCookie: currentUser.setCookie } : {}),
    };
  }

  try {
    await currentUser.pb.collection("users").requestVerification(currentUser.user.email);

    return {
      ok: true,
      data: {
        sent: true,
      },
    };
  } catch (error) {
    const errorCode = mapRequestEmailVerificationErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("requestEmailVerificationForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
      ...(errorCode === "UNAUTHORIZED" ? { setCookie: createClearedAuthAndDeviceCookies() } : {}),
    };
  }
}

export async function confirmEmailChangeToken(input: {
  token: string;
  password: string;
}): Promise<ServerAuthResponse<ConfirmEmailChangePayload>> {
  const { pb, hadInvalidAuthCookie, shouldPersistSession } = await createPocketBaseServerClient();

  try {
    await pb.collection("users").confirmEmailChange(input.token, input.password);

    if (pb.authStore.isValid && isUsersRecord(pb.authStore.record)) {
      const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();
      const session = createAuthSession(pb, refreshedAuth.record);

      if (!session) {
        return {
          ok: true,
          data: {
            emailChanged: true,
            session: null,
          },
          setCookie: createClearedPocketBaseAuthCookies(),
        };
      }

      return {
        ok: true,
        data: {
          emailChanged: true,
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
        emailChanged: true,
        session: null,
      },
      ...(hadInvalidAuthCookie ? { setCookie: createClearedAuthAndDeviceCookies() } : {}),
    };
  } catch (error) {
    const errorCode = mapConfirmEmailChangeErrorCode(error);

    if (errorCode === "UNKNOWN_ERROR") {
      logAuthServiceError("confirmEmailChangeToken", error);
    }

    return {
      ok: false,
      errorCode,
      ...(errorCode === "UNAUTHORIZED" || hadInvalidAuthCookie
        ? { setCookie: createClearedAuthAndDeviceCookies() }
        : {}),
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
    const deviceSessionToken = await readDeviceSessionCookie();
    const deviceSessionCheck = await validateDeviceSessionOrInvalidate({
      pb,
      userId: pb.authStore.record.id,
      deviceSessionToken,
      shouldUpdateHeartbeat: false,
    });

    if (deviceSessionCheck.status === "invalid") {
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: deviceSessionCheck.clearCookies,
      };
    }

    const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();
    const session = createAuthSession(pb, refreshedAuth.record);

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
    // User record not found (deleted/banned) — expected scenario, not a real error.
    if (error instanceof ClientResponseError && error.status === 404) {
      console.warn("[auth-service] getServerAuthSession: user record not found, clearing session");
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: createClearedAuthAndDeviceCookies(),
      };
    }

    if (
      error instanceof ClientResponseError &&
      (error.status === 400 || error.status === 401 || error.status === 403)
    ) {
      console.warn("[auth-service] getServerAuthSession: auth refresh failed, clearing session");
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: createClearedAuthAndDeviceCookies(),
      };
    }

    logAuthServiceError("getServerAuthSession", error);

    // Transient error (5xx / network) — return stale session from the local JWT.
    if (isTransientError(error) && isUsersRecord(pb.authStore.record)) {
      console.warn("[auth-service] getServerAuthSession: PB unavailable, stale session");
      const staleSession = createAuthSession(pb, pb.authStore.record);

      return {
        ok: true,
        data: {
          session: staleSession,
        },
      };
    }

    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedAuthAndDeviceCookies(),
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
      setCookie: createClearedAuthAndDeviceCookies(),
    };
  }

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return {
      ok: true,
      data: {
        session: null,
      },
      ...(hasAuthCookie ? { setCookie: createClearedAuthAndDeviceCookies() } : {}),
    };
  }

  if (!isUsersRecord(pb.authStore.record)) {
    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedAuthAndDeviceCookies(),
    };
  }

  try {
    const deviceSessionToken = await readDeviceSessionCookie();
    const deviceSessionCheck = await validateDeviceSessionOrInvalidate({
      pb,
      userId: pb.authStore.record.id,
      deviceSessionToken,
      shouldUpdateHeartbeat: true,
    });

    if (deviceSessionCheck.status === "invalid") {
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: deviceSessionCheck.clearCookies,
      };
    }

    const refreshedAuth = await pb.collection("users").authRefresh<UsersRecord>();
    const session = createAuthSession(pb, refreshedAuth.record);

    if (!session) {
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: createClearedAuthAndDeviceCookies(),
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
    // User record not found (deleted/banned) — expected scenario, not a real error.
    if (error instanceof ClientResponseError && error.status === 404) {
      console.warn("[auth-service] getApiAuthSession: user record not found, clearing session");
      return {
        ok: true,
        data: {
          session: null,
        },
        setCookie: createClearedAuthAndDeviceCookies(),
      };
    }

    logAuthServiceError("getApiAuthSession", error);

    // Transient error (5xx / network) — keep existing cookie, return stale session.
    if (isTransientError(error) && isUsersRecord(pb.authStore.record)) {
      console.warn("[auth-service] getApiAuthSession: PB unavailable, stale session");
      const staleSession = createAuthSession(pb, pb.authStore.record);

      return {
        ok: true,
        data: {
          session: staleSession,
        },
      };
    }

    return {
      ok: true,
      data: {
        session: null,
      },
      setCookie: createClearedAuthAndDeviceCookies(),
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

function createDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

function mapSignInErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
    if (
      pocketBaseError.status === 400 ||
      pocketBaseError.status === 401 ||
      pocketBaseError.status === 404
    ) {
      return "INVALID_CREDENTIALS";
    }

    return null;
  });
}

function mapSignUpErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
    if (pocketBaseError.status === 400) {
      if (hasValidationCode(pocketBaseError.response?.data, "email", "validation_not_unique")) {
        return "EMAIL_ALREADY_IN_USE";
      }

      if (
        hasValidationCode(
          pocketBaseError.response?.data,
          "password",
          "validation_length_out_of_range"
        )
      ) {
        return "WEAK_PASSWORD";
      }

      return "VALIDATION_ERROR";
    }

    return null;
  });
}

function mapVerifyEmailErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
    if (pocketBaseError.status === 400 || pocketBaseError.status === 404) {
      return "BAD_REQUEST";
    }

    return null;
  });
}

function mapResetPasswordErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
    if (pocketBaseError.status === 400 || pocketBaseError.status === 404) {
      if (
        hasValidationCode(
          pocketBaseError.response?.data,
          "password",
          "validation_length_out_of_range"
        )
      ) {
        return "WEAK_PASSWORD";
      }

      return "BAD_REQUEST";
    }

    return null;
  });
}

function mapRequestEmailVerificationErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
    if (pocketBaseError.status === 400) {
      return "BAD_REQUEST";
    }

    if (pocketBaseError.status === 401 || pocketBaseError.status === 403) {
      return "UNAUTHORIZED";
    }

    if (pocketBaseError.status === 404) {
      return "NOT_FOUND";
    }

    return null;
  });
}

function mapConfirmEmailChangeErrorCode(error: unknown): AuthErrorCode {
  return mapPocketBaseError(error, (pocketBaseError) => {
    if (pocketBaseError.status === 401 || pocketBaseError.status === 403) {
      return "UNAUTHORIZED";
    }

    if (pocketBaseError.status === 400 || pocketBaseError.status === 404) {
      return "BAD_REQUEST";
    }

    return null;
  });
}

/** Status 0 (network) or ≥ 500 (server) — as opposed to 401 (invalid token). */
function isTransientError(error: unknown): boolean {
  if (error instanceof ClientResponseError) {
    return error.status === 0 || error.status >= 500;
  }

  return true;
}

function logAuthServiceError(context: string, error: unknown) {
  logServiceError("auth-service", context, error);
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

export async function finalizeAuthAction<TData>(
  response: ServerAuthResponse<TData>
): Promise<AuthResponse<TData>> {
  await applyServerAuthCookies(response.setCookie);

  return toAuthApiResponse(response);
}
