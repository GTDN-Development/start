import { headers } from "next/headers";
import type PocketBase from "pocketbase";
import { ClientResponseError } from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserDeviceSessionsRecord, UsersRecord } from "@/types/pocketbase";

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
import { hashSessionToken } from "@/server/device-sessions/device-sessions-service";
import {
  getResponseAuthSession,
  getServerAuthSession,
  signInWithPassword,
  signOutServerSession,
} from "./auth-session-service";
import { requestEmailVerificationForEmail } from "./auth-email-verification-service";
import { requestPasswordResetForEmail } from "./auth-password-reset-service";

describe("auth-service", function describeAuthService() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(function suppressErrorLog() {
      return undefined;
    });
    vi.mocked(createClearedAuthAndDeviceCookies).mockReturnValue([
      "pb_auth=; Max-Age=0",
      "device_session=; Max-Age=0",
    ]);
    vi.mocked(headers).mockResolvedValue(
      new Headers({
        "user-agent": "Mozilla/5.0",
      }) as never
    );
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

  it.each([
    {
      name: "keeps email verification requests anti-enumerating for unknown emails",
      status: 404,
      expectedResponse: {
        ok: true as const,
        data: {
          sent: true as const,
        },
        setCookie: ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"],
      },
    },
    {
      name: "returns rate-limited for email verification throttling",
      status: 429,
      expectedResponse: {
        ok: false as const,
        errorCode: "RATE_LIMITED" as const,
        setCookie: ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"],
      },
    },
  ])("$name", async function testEmailVerificationRequest(input) {
    const context = createAuthServiceContext({
      hadInvalidAuthCookie: true,
    });

    context.usersCollection.requestVerification.mockRejectedValue(
      createClientResponseError(input.status)
    );
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await requestEmailVerificationForEmail("user@example.com");

    expect(response).toEqual(input.expectedResponse);
  });

  it("fails closed when device session registration fails during sign-in", async function testSignInDeviceSessionRegistrationFailure() {
    const context = createAuthServiceContext();

    context.usersCollection.authWithPassword.mockResolvedValue({
      record: createUserRecord("user-1", "user@example.com"),
    });
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    context.deviceSessionsCollection.getFirstListItem.mockRejectedValueOnce(
      new Error("device session write failed")
    );

    const response = await signInWithPassword({
      email: "user@example.com",
      password: "secret-password",
      rememberMe: true,
    });

    expect(response).toEqual({
      ok: false,
      errorCode: "UNKNOWN_ERROR",
      setCookie: ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"],
    });
  });

  it("revokes the current auth device session during sign-out", async function testSignOutRevokesCurrentDeviceSession() {
    const context = createAuthServiceContext({
      authStoreRecord: createUserRecord("user-1", "user@example.com"),
      authStoreValid: true,
    });

    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    vi.mocked(readDeviceSessionCookie).mockResolvedValue("device-token");
    context.deviceSessionsCollection.getFirstListItem.mockResolvedValue(
      createDeviceSessionRecord("session-1", {
        sessionIdHash: hashSessionToken("device-token"),
        userId: "user-1",
      }) as never
    );

    const response = await signOutServerSession();

    expect(response).toEqual({
      ok: true,
      data: {
        signedOut: true,
      },
      setCookie: ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"],
    });
    expect(context.deviceSessionsCollection.delete).toHaveBeenCalledWith("session-1");
  });

  it("returns null session when the render-time device session is invalid", async function testGetServerAuthSessionNullSession() {
    createAuthRenderContext({
      deviceSessionLookupError: createClientResponseError(404),
    });

    const response = await getServerAuthSession();

    expect(response).toEqual({
      ok: true,
      data: {
        session: null,
      },
    });
    expect(readDeviceSessionCookie).toHaveBeenCalledOnce();
  });

  it.each([
    {
      name: "clears cookies in the response-writing session path when the device session is invalid",
      setup: function setup() {
        const context = createAuthServiceContext({
          authStoreRecord: createUserRecord("user-1", "user@example.com"),
          authStoreValid: true,
        });

        vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
        vi.mocked(readDeviceSessionCookie).mockResolvedValue("device-token");
        context.deviceSessionsCollection.getFirstListItem.mockRejectedValue(
          createClientResponseError(404)
        );
        return context;
      },
      expectedResponse: {
        ok: true as const,
        data: {
          session: null,
        },
        setCookie: ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"],
      },
    },
    {
      name: "refreshes and rewrites auth cookies in the response-writing session path",
      setup: function setup() {
        const context = createAuthServiceContext({
          authStoreRecord: createUserRecord("user-1", "user@example.com"),
          authStoreValid: true,
          shouldPersistSession: true,
        });

        vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
        vi.mocked(readDeviceSessionCookie).mockResolvedValue("device-token");
        context.deviceSessionsCollection.getFirstListItem.mockResolvedValue(
          createDeviceSessionRecord("session-1", {
            sessionIdHash: hashSessionToken("device-token"),
            userId: "user-1",
          }) as never
        );
        context.usersCollection.authRefresh.mockResolvedValue({
          record: createUserRecord("user-1", "user@example.com", {
            verified: false,
          }),
        });
        return context;
      },
      expectedResponse: {
        ok: true as const,
        data: {
          session: null,
        },
        setCookie: ["pb_auth=token", "pb_persist=1"],
      },
    },
  ])("$name", async function testGetResponseAuthSession(input) {
    input.setup();

    const response = await getResponseAuthSession();

    expect(response).toEqual(input.expectedResponse);
  });
});

function createAuthServiceContext(input?: {
  authStoreRecord?: UsersRecord | null;
  authStoreValid?: boolean;
  hadInvalidAuthCookie?: boolean;
  hasAuthCookie?: boolean;
  shouldPersistSession?: boolean;
}) {
  const deviceSessionsCollection = {
    create: vi.fn(async function createDeviceSession() {
      return undefined;
    }),
    delete: vi.fn(async function deleteDeviceSession() {
      return undefined;
    }),
    getFirstListItem: vi.fn(async function getFirstDeviceSession() {
      throw createClientResponseError(404);
    }),
    getFullList: vi.fn(async function getDeviceSessions() {
      return [];
    }),
    update: vi.fn(async function updateDeviceSession() {
      return undefined;
    }),
  };
  const usersCollection = {
    authRefresh: vi.fn(),
    authWithPassword: vi.fn(),
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
      if (name === "users") {
        return usersCollection;
      }

      if (name === "user_device_sessions") {
        return deviceSessionsCollection;
      }

      throw new Error(`Unexpected collection: ${name}`);
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
    deviceSessionsCollection,
    pb,
    usersCollection,
  };
}

function createAuthRenderContext(input: { deviceSessionLookupError?: Error }) {
  const context = createAuthServiceContext({
    authStoreRecord: createUserRecord("user-1", "user@example.com"),
    authStoreValid: true,
  });

  vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
  vi.mocked(readDeviceSessionCookie).mockResolvedValue("device-token");

  if (input.deviceSessionLookupError) {
    context.deviceSessionsCollection.getFirstListItem.mockRejectedValue(
      input.deviceSessionLookupError
    );
  }

  return context;
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

function createDeviceSessionRecord(
  id: string,
  input: {
    sessionIdHash: string;
    userId: string;
  }
): UserDeviceSessionsRecord {
  const lastSeenAt = new Date().toISOString();

  return {
    id,
    collectionId: "user_device_sessions",
    collectionName: "user_device_sessions",
    created: "2026-01-01T00:00:00.000Z",
    updated: "2026-01-01T00:00:00.000Z",
    user: input.userId,
    session_id_hash: input.sessionIdHash,
    device_label: "MacBook Pro",
    device_type: "desktop",
    browser: "Chrome",
    os: "macOS",
    user_agent: "Mozilla/5.0",
    last_seen_at: lastSeenAt,
    expires_at: "2099-01-01T00:00:00.000Z",
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
