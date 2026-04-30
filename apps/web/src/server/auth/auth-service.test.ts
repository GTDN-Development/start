import type PocketBase from "pocketbase";
import { ClientResponseError } from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord } from "@/types/pocketbase";

vi.mock("@/server/pocketbase/pocketbase-server", function mockPocketBaseServer() {
  return {
    createClearedPocketBaseAuthCookies: vi.fn(),
    createPocketBaseServerClient: vi.fn(),
    exportPocketBaseAuthCookies: vi.fn(),
  };
});

import {
  createClearedPocketBaseAuthCookies,
  createPocketBaseServerClient,
  exportPocketBaseAuthCookies,
} from "@/server/pocketbase/pocketbase-server";
import {
  getResponseAuthSession,
  getServerAuthSession,
  signInWithPassword,
  signOutServerSession,
} from "./auth-session-service";
import { requestEmailVerificationForEmail } from "./auth-email-verification-service";
import { requestPasswordResetForEmail } from "./auth-password-reset-service";

type AuthServiceContext = ReturnType<typeof createAuthServiceContext>;

const CLEARED_PB_AUTH_COOKIES = ["pb_auth=; Max-Age=0"];

describe("auth-service", function describeAuthService() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(function suppressErrorLog() {
      return undefined;
    });
    vi.mocked(createClearedPocketBaseAuthCookies).mockReturnValue(CLEARED_PB_AUTH_COOKIES);
    vi.mocked(exportPocketBaseAuthCookies).mockImplementation(
      function exportAuthCookies(_pb, options) {
        return ["pb_auth=token", options?.sessionOnly ? "pb_persist=0" : "pb_persist=1"];
      }
    );
  });

  it.each([
    {
      name: "keeps password reset requests anti-enumerating for unknown emails",
      setup(context: AuthServiceContext) {
        context.usersCollection.requestPasswordReset.mockRejectedValue(
          createClientResponseError(404)
        );
      },
      request() {
        return requestPasswordResetForEmail("missing@example.com");
      },
      expectedResponse: {
        ok: true as const,
        data: {
          sent: true as const,
        },
      },
    },
    {
      name: "keeps email verification requests anti-enumerating for unknown emails",
      contextInput: {
        authCookieState: "invalid" as const,
      },
      setup(context: AuthServiceContext) {
        context.usersCollection.requestVerification.mockRejectedValue(
          createClientResponseError(404)
        );
      },
      request() {
        return requestEmailVerificationForEmail("user@example.com");
      },
      expectedResponse: {
        ok: true as const,
        data: {
          sent: true as const,
        },
        setCookie: CLEARED_PB_AUTH_COOKIES,
      },
    },
    {
      name: "returns rate-limited for email verification throttling",
      contextInput: {
        authCookieState: "invalid" as const,
      },
      setup(context: AuthServiceContext) {
        context.usersCollection.requestVerification.mockRejectedValue(
          createClientResponseError(429)
        );
      },
      request() {
        return requestEmailVerificationForEmail("user@example.com");
      },
      expectedResponse: {
        ok: false as const,
        errorCode: "RATE_LIMITED" as const,
        setCookie: CLEARED_PB_AUTH_COOKIES,
      },
    },
  ])(
    "$name",
    async function testRequestHandling({ contextInput, expectedResponse, request, setup }) {
      const context = createAuthServiceContext(contextInput);
      setup(context);
      vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
      expect(await request()).toEqual(expectedResponse);
    }
  );

  it("signs in verified users with PocketBase auth cookies only", async function testSignInVerified() {
    const context = createAuthServiceContext();

    context.usersCollection.authWithPassword.mockResolvedValue({
      record: createUserRecord("user-1", "user@example.com"),
    });
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await signInWithPassword({
      email: "user@example.com",
      password: "secret-password",
      rememberMe: true,
    });

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
      setCookie: ["pb_auth=token", "pb_persist=1"],
    });
  });

  it("keeps unverified sign-in on PocketBase cookies without creating app sessions", async function testSignInUnverified() {
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
      rememberMe: false,
    });

    expect(response).toEqual({
      ok: false,
      errorCode: "EMAIL_NOT_VERIFIED",
      setCookie: ["pb_auth=token", "pb_persist=0"],
    });
  });

  it("clears only PocketBase auth cookies during sign-out", async function testSignOut() {
    const response = await signOutServerSession();

    expect(response).toEqual({
      ok: true,
      data: {
        signedOut: true,
      },
      setCookie: CLEARED_PB_AUTH_COOKIES,
    });
  });

  it("returns null session when render-time auth resolution is unauthenticated", async function testGetServerAuthSessionNullSession() {
    const context = createAuthServiceContext();

    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await getServerAuthSession();

    expect(response).toEqual({
      ok: true,
      data: {
        session: null,
      },
    });
  });

  it("refreshes and rewrites PocketBase auth cookies in the response-writing session path", async function testGetResponseAuthSessionRefresh() {
    const context = createAuthServiceContext({
      authStoreRecord: createUserRecord("user-1", "user@example.com"),
      authStoreValid: true,
      shouldPersistSession: true,
    });

    context.usersCollection.authRefresh.mockResolvedValue({
      record: createUserRecord("user-1", "user@example.com"),
    });
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await getResponseAuthSession();

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
      setCookie: ["pb_auth=token", "pb_persist=1"],
    });
  });
});

function createAuthServiceContext(input?: {
  authStoreRecord?: UsersRecord | null;
  authStoreValid?: boolean;
  authCookieState?: "missing" | "present" | "invalid";
  shouldPersistSession?: boolean;
}) {
  const authCookieState =
    input?.authCookieState ?? ((input?.authStoreValid ?? false) ? "present" : "missing");
  const usersCollection = {
    authRefresh: vi.fn(),
    authWithPassword: vi.fn(),
    getOne: vi.fn(),
    requestPasswordReset: vi.fn(),
    requestVerification: vi.fn(),
  };
  const pb = {
    authStore: {
      isValid: input?.authStoreValid ?? authCookieState === "present",
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
      authCookieState,
      pb,
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
