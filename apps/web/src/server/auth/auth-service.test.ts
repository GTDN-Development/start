import type PocketBase from "pocketbase";
import { ClientResponseError } from "pocketbase";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord } from "@/types/pocketbase";

vi.mock("next/headers", function mockNextHeaders() {
  return {
    headers: vi.fn(),
  };
});

vi.mock("@/server/pocketbase/pocketbase-server", function mockPocketBaseServer() {
  return {
    createClearedPocketBaseAuthCookies: vi.fn(),
    createPocketBaseServerClient: vi.fn(),
    exportPocketBaseAuthCookies: vi.fn(),
  };
});

vi.mock("@/server/device-sessions/device-sessions-cookie", function mockDeviceSessionCookie() {
  return {
    createClearedAuthAndDeviceCookies: vi.fn(),
    createDeviceSessionCookie: vi.fn(),
    generateDeviceSessionCookie: vi.fn(),
    readDeviceSessionCookie: vi.fn(),
  };
});

vi.mock("@/server/device-sessions/device-sessions-service", function mockDeviceSessionsService() {
  return {
    checkDeviceSessionReadOnly: vi.fn(),
    hashSessionToken: vi.fn(),
    registerOrRefreshDeviceSession: vi.fn(),
    revokeCurrentDeviceSession: vi.fn(),
    validateDeviceSessionOrInvalidate: vi.fn(),
  };
});

import {
  createClearedPocketBaseAuthCookies,
  createPocketBaseServerClient,
  exportPocketBaseAuthCookies,
} from "@/server/pocketbase/pocketbase-server";
import {
  createClearedAuthAndDeviceCookies,
  generateDeviceSessionCookie,
  readDeviceSessionCookie,
} from "@/server/device-sessions/device-sessions-cookie";
import {
  checkDeviceSessionReadOnly,
  registerOrRefreshDeviceSession,
  validateDeviceSessionOrInvalidate,
} from "@/server/device-sessions/device-sessions-service";
import { getResponseAuthSession, getServerAuthSession } from "./auth-session-service";
import {
  confirmEmailVerificationToken,
  confirmEmailChangeToken,
  requestEmailVerificationForEmail,
} from "./auth-email-verification-service";
import {
  confirmPasswordResetToken,
  requestPasswordResetForEmail,
} from "./auth-password-reset-service";
import { signUpWithPassword } from "./auth-sign-up-service";
import { signInWithPassword } from "./auth-session-service";

describe("auth-service", function describeAuthService() {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(function suppressErrorLog() {
      return undefined;
    });
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(function suppressWarnLog() {
      return undefined;
    });
    vi.mocked(createClearedAuthAndDeviceCookies).mockReturnValue([
      "pb_auth=; Max-Age=0",
      "device_session=; Max-Age=0",
    ]);
    vi.mocked(generateDeviceSessionCookie).mockReturnValue({
      token: "device-token-new",
      setCookie: "device_session=device-token-new",
    });
    vi.mocked(createClearedPocketBaseAuthCookies).mockReturnValue(["pb_auth=; Max-Age=0"]);
    vi.mocked(exportPocketBaseAuthCookies).mockImplementation(
      function exportAuthCookies(_pb, options) {
        return ["pb_auth=token", options?.sessionOnly ? "pb_persist=0" : "pb_persist=1"];
      }
    );
  });

  afterEach(function restoreConsoleSpies() {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it("keeps password reset requests anti-enumerating for unknown emails", async function testResetRequestUnknownEmail() {
    const context = createAuthServiceContext();

    context.usersCollection.requestPasswordReset.mockRejectedValue(createClientResponseError(404));
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await requestPasswordResetForEmail("missing@example.com");

    expect(response).toEqual({
      ok: true,
      data: {
        sent: true,
      },
    });
  });

  it("returns rate-limited for password reset throttling", async function testResetRequestRateLimit() {
    const context = createAuthServiceContext();

    context.usersCollection.requestPasswordReset.mockRejectedValue(createClientResponseError(429));
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await requestPasswordResetForEmail("user@example.com");

    expect(response).toEqual({
      ok: false,
      errorCode: "RATE_LIMITED",
    });
  });

  it("keeps email verification requests anti-enumerating and clears invalid cookies", async function testVerificationRequestInvalidCookieSuccess() {
    const context = createAuthServiceContext({
      hadInvalidAuthCookie: true,
    });

    context.usersCollection.requestVerification.mockRejectedValue(createClientResponseError(404));
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await requestEmailVerificationForEmail("missing@example.com");

    expect(response).toEqual({
      ok: true,
      data: {
        sent: true,
      },
      setCookie: ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"],
    });
  });

  it("keeps email verification requests generic for already verified emails", async function testVerificationRequestAlreadyVerified() {
    const context = createAuthServiceContext({
      hadInvalidAuthCookie: true,
    });

    context.usersCollection.requestVerification.mockRejectedValue(createClientResponseError(400));
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await requestEmailVerificationForEmail("verified@example.com");

    expect(response).toEqual({
      ok: true,
      data: {
        sent: true,
      },
      setCookie: ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"],
    });
  });

  it("returns rate-limited for email verification throttling and clears invalid cookies", async function testVerificationRequestRateLimit() {
    const context = createAuthServiceContext({
      hadInvalidAuthCookie: true,
    });

    context.usersCollection.requestVerification.mockRejectedValue(createClientResponseError(429));
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await requestEmailVerificationForEmail("user@example.com");

    expect(response).toEqual({
      ok: false,
      errorCode: "RATE_LIMITED",
      setCookie: ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"],
    });
  });

  it("clears auth and device cookies after a successful password reset confirmation", async function testConfirmPasswordResetSuccess() {
    const context = createAuthServiceContext();

    context.usersCollection.confirmPasswordReset.mockResolvedValue(undefined);
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await confirmPasswordResetToken({
      token: "reset-token",
      password: "next-password",
      confirmPassword: "next-password",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        passwordReset: true,
      },
      setCookie: ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"],
    });
  });

  it("clears auth and device cookies after a successful email change confirmation", async function testConfirmEmailChangeSuccess() {
    const context = createAuthServiceContext();

    context.usersCollection.confirmEmailChange.mockResolvedValue(undefined);
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await confirmEmailChangeToken({
      token: "email-change-token",
      password: "secret-password",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        emailChanged: true,
      },
      setCookie: ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"],
    });
  });

  it("clears cookies on email change failure when the auth cookie was already invalid", async function testConfirmEmailChangeInvalidCookie() {
    const context = createAuthServiceContext({
      hadInvalidAuthCookie: true,
    });

    context.usersCollection.confirmEmailChange.mockRejectedValue(createClientResponseError(400));
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await confirmEmailChangeToken({
      token: "email-change-token",
      password: "secret-password",
    });

    expect(response).toEqual({
      ok: false,
      errorCode: "BAD_REQUEST",
      setCookie: ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"],
    });
  });

  it("keeps unverified sign-in on PocketBase auth only without creating a device session", async function testSignInUnverifiedWithoutDeviceSession() {
    const context = createAuthServiceContext();

    context.usersCollection.authWithPassword.mockResolvedValue({
      record: createUserRecord("user-1", "user@example.com", {
        verified: false,
      }),
    });
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await signInWithPassword({
      email: "user@example.com",
      password: "secret-password",
      rememberMe: true,
    });

    expect(response).toEqual({
      ok: false,
      errorCode: "EMAIL_NOT_VERIFIED",
      setCookie: ["pb_auth=token", "pb_persist=1"],
    });
    expect(exportPocketBaseAuthCookies).toHaveBeenCalledWith(context.pb, {
      sessionOnly: false,
    });
    expect(registerOrRefreshDeviceSession).not.toHaveBeenCalled();
  });

  it("keeps sign-up verification bootstrap on PocketBase auth only without creating a device session", async function testSignUpWithoutDeviceSession() {
    const context = createAuthServiceContext();

    context.usersCollection.create.mockResolvedValue(
      createUserRecord("user-1", "user@example.com", {
        verified: false,
      })
    );
    context.usersCollection.requestVerification.mockResolvedValue(undefined);
    context.usersCollection.authWithPassword.mockResolvedValue({
      record: createUserRecord("user-1", "user@example.com", {
        verified: false,
      }),
    });
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await signUpWithPassword({
      firstName: "Test",
      lastName: "User",
      email: "user@example.com",
      password: "secret-password",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        created: true,
      },
      setCookie: ["pb_auth=token", "pb_persist=0"],
    });
    expect(exportPocketBaseAuthCookies).toHaveBeenCalledWith(context.pb, {
      sessionOnly: true,
    });
    expect(registerOrRefreshDeviceSession).not.toHaveBeenCalled();
  });

  it("creates a custom device session after successful email verification", async function testConfirmEmailVerificationCreatesDeviceSession() {
    const context = createAuthServiceContext({
      authStoreRecord: createUserRecord("user-1", "user@example.com", {
        verified: false,
      }),
      authStoreValid: true,
      shouldPersistSession: true,
    });

    context.usersCollection.confirmVerification.mockResolvedValue(undefined);
    context.usersCollection.authRefresh.mockResolvedValue({
      record: createUserRecord("user-1", "user@example.com", {
        verified: true,
      }),
    });
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    vi.mocked(readDeviceSessionCookie).mockResolvedValue(null);

    const response = await confirmEmailVerificationToken("verification-token");

    expect(response).toEqual({
      ok: true,
      data: {
        session: {
          user: {
            id: "user-1",
            email: "user@example.com",
            name: "User",
            avatarUrl: null,
          },
        },
      },
      setCookie: ["pb_auth=token", "pb_persist=1", "device_session=device-token-new"],
    });
    expect(registerOrRefreshDeviceSession).toHaveBeenCalledTimes(1);
  });

  it("returns null session and clears cookies when the auth cookie is invalid", async function testGetServerAuthSessionInvalidAuthCookie() {
    const context = createAuthServiceContext({
      hadInvalidAuthCookie: true,
    });

    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await getServerAuthSession();

    expect(response).toEqual({
      ok: true,
      data: {
        session: null,
      },
    });
    expect(readDeviceSessionCookie).not.toHaveBeenCalled();
  });

  it("returns null session when the render-time device session is invalid", async function testGetServerAuthSessionInvalidDeviceSession() {
    const context = createAuthServiceContext({
      authStoreRecord: createUserRecord("user-1", "user@example.com"),
      authStoreValid: true,
    });

    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    vi.mocked(readDeviceSessionCookie).mockResolvedValue("device-token");
    vi.mocked(checkDeviceSessionReadOnly).mockResolvedValue({
      status: "invalid",
    });

    const response = await getServerAuthSession();

    expect(response).toEqual({
      ok: true,
      data: {
        session: null,
      },
    });
    expect(checkDeviceSessionReadOnly).toHaveBeenCalledWith({
      pb: context.pb,
      userId: "user-1",
      deviceSessionToken: "device-token",
    });
    expect(validateDeviceSessionOrInvalidate).not.toHaveBeenCalled();
    expect(context.usersCollection.authRefresh).not.toHaveBeenCalled();
  });

  it("returns null session for read-only checks when the fresh user record is unverified", async function testGetServerAuthSessionUnverifiedUser() {
    const context = createAuthServiceContext({
      authStoreRecord: createUserRecord("user-1", "user@example.com"),
      authStoreValid: true,
    });

    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    vi.mocked(readDeviceSessionCookie).mockResolvedValue("device-token");
    vi.mocked(checkDeviceSessionReadOnly).mockResolvedValue({
      status: "valid",
      sessionIdHash: "session-hash-1",
    });
    context.usersCollection.getOne.mockResolvedValue(
      createUserRecord("user-1", "user@example.com", {
        verified: false,
      })
    );

    const response = await getServerAuthSession();

    expect(response).toEqual({
      ok: true,
      data: {
        session: null,
      },
    });
    expect(context.usersCollection.authRefresh).not.toHaveBeenCalled();
    expect(validateDeviceSessionOrInvalidate).not.toHaveBeenCalled();
  });

  it("returns the stale verified session on transient render-time backend errors", async function testGetServerAuthSessionTransientError() {
    const user = createUserRecord("user-1", "user@example.com");
    const context = createAuthServiceContext({
      authStoreRecord: user,
      authStoreValid: true,
    });

    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    vi.mocked(readDeviceSessionCookie).mockResolvedValue("device-token");
    vi.mocked(checkDeviceSessionReadOnly).mockResolvedValue({
      status: "valid",
      sessionIdHash: "session-hash-1",
    });
    context.usersCollection.getOne.mockRejectedValue(createClientResponseError(503));

    const response = await getServerAuthSession();

    expect(response).toEqual({
      ok: true,
      data: {
        session: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: null,
          },
        },
      },
    });
    expect(context.usersCollection.authRefresh).not.toHaveBeenCalled();
  });

  it("clears cookies in the response-writing session path when the device session is invalid", async function testGetResponseAuthSessionInvalidDeviceSession() {
    const context = createAuthServiceContext({
      authStoreRecord: createUserRecord("user-1", "user@example.com"),
      authStoreValid: true,
    });

    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    vi.mocked(readDeviceSessionCookie).mockResolvedValue("device-token");
    vi.mocked(validateDeviceSessionOrInvalidate).mockResolvedValue({
      status: "invalid",
      clearCookies: ["device_session=; Max-Age=0"],
    });

    const response = await getResponseAuthSession();

    expect(response).toEqual({
      ok: true,
      data: {
        session: null,
      },
      setCookie: ["device_session=; Max-Age=0"],
    });
    expect(context.usersCollection.authRefresh).not.toHaveBeenCalled();
  });

  it("refreshes and rewrites auth cookies in the response-writing session path", async function testGetResponseAuthSessionUnverifiedUser() {
    const context = createAuthServiceContext({
      authStoreRecord: createUserRecord("user-1", "user@example.com"),
      authStoreValid: true,
      shouldPersistSession: true,
    });

    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    vi.mocked(readDeviceSessionCookie).mockResolvedValue("device-token");
    vi.mocked(validateDeviceSessionOrInvalidate).mockResolvedValue({
      status: "valid",
      sessionIdHash: "session-hash-1",
    });
    context.usersCollection.authRefresh.mockResolvedValue({
      record: createUserRecord("user-1", "user@example.com", {
        verified: false,
      }),
    });

    const response = await getResponseAuthSession();

    expect(response).toEqual({
      ok: true,
      data: {
        session: null,
      },
      setCookie: ["pb_auth=token", "pb_persist=1"],
    });
    expect(exportPocketBaseAuthCookies).toHaveBeenCalledWith(context.pb, {
      sessionOnly: false,
    });
  });

  it("returns the stale verified session on transient response-writing backend errors", async function testGetResponseAuthSessionTransientError() {
    const user = createUserRecord("user-1", "user@example.com");
    const context = createAuthServiceContext({
      authStoreRecord: user,
      authStoreValid: true,
    });

    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    vi.mocked(readDeviceSessionCookie).mockResolvedValue("device-token");
    vi.mocked(validateDeviceSessionOrInvalidate).mockResolvedValue({
      status: "valid",
      sessionIdHash: "session-hash-1",
    });
    context.usersCollection.authRefresh.mockRejectedValue(createClientResponseError(503));

    const response = await getResponseAuthSession();

    expect(response).toEqual({
      ok: true,
      data: {
        session: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatarUrl: null,
          },
        },
      },
    });
  });
});

function createAuthServiceContext(input?: {
  authStoreRecord?: UsersRecord | null;
  authStoreValid?: boolean;
  hadInvalidAuthCookie?: boolean;
  hasAuthCookie?: boolean;
  shouldPersistSession?: boolean;
}) {
  const usersCollection = {
    authRefresh: vi.fn(),
    authWithPassword: vi.fn(),
    confirmVerification: vi.fn(),
    confirmEmailChange: vi.fn(),
    confirmPasswordReset: vi.fn(),
    create: vi.fn(),
    getOne: vi.fn(),
    requestPasswordReset: vi.fn(),
    requestVerification: vi.fn(),
  };
  const pb = {
    authStore: {
      isValid: input?.authStoreValid ?? false,
      record: input?.authStoreRecord ?? null,
    },
    collection: vi.fn(function getCollection(name: string) {
      if (name !== "users") {
        throw new Error(`Unexpected collection: ${name}`);
      }

      return usersCollection;
    }),
    files: {
      getURL: vi.fn(function getUrl() {
        return "https://pb.test/files/avatar.png";
      }),
    },
  } as unknown as PocketBase;

  return {
    client: {
      pb,
      hadInvalidAuthCookie: input?.hadInvalidAuthCookie ?? false,
      hasAuthCookie: input?.hasAuthCookie ?? false,
      shouldPersistSession: input?.shouldPersistSession ?? true,
    },
    pb,
    usersCollection,
  };
}

function createUserRecord(
  id: string,
  email: string,
  input?: {
    verified?: boolean;
  }
): UsersRecord {
  return {
    id,
    avatar: "",
    collectionId: "users",
    collectionName: "users",
    created: "2026-01-01T00:00:00.000Z",
    email,
    name: "User",
    updated: "2026-01-01T00:00:00.000Z",
    verified: input?.verified ?? true,
  };
}

function createClientResponseError(status: number) {
  return new ClientResponseError({
    message: `HTTP ${status}`,
    response: {},
    status,
    url: "http://localhost:8090/api/test",
  });
}
