import type PocketBase from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord } from "@/types/pocketbase";
import {
  resolveRenderAuthenticatedUser,
  resolveWritableAuthenticatedUser,
} from "./auth-user-resolution";

const {
  isTransientErrorMock,
  resolveCurrentAuthDeviceSessionMock,
  createClearedAuthAndDeviceCookiesMock,
  createPocketBaseServerClientMock,
  exportPocketBaseAuthCookiesMock,
} = vi.hoisted(function hoistAuthUserResolutionMocks() {
  return {
    isTransientErrorMock: vi.fn(function isTransientError() {
      return false;
    }),
    resolveCurrentAuthDeviceSessionMock: vi.fn(),
    createClearedAuthAndDeviceCookiesMock: vi.fn(function createClearedAuthAndDeviceCookies() {
      return ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"];
    }),
    createPocketBaseServerClientMock: vi.fn(),
    exportPocketBaseAuthCookiesMock: vi.fn(function exportPocketBaseAuthCookies() {
      return ["pb_auth=token", "pb_persist=1"];
    }),
  };
});

vi.mock("@/server/auth/auth-errors", function mockAuthErrors() {
  return {
    isTransientError: isTransientErrorMock,
  };
});

vi.mock(
  "@/server/auth/auth-device-session-integration",
  function mockAuthDeviceSessionIntegration() {
    return {
      resolveCurrentAuthDeviceSession: resolveCurrentAuthDeviceSessionMock,
    };
  }
);

vi.mock("@/server/device-sessions/device-sessions-cookie", function mockDeviceSessionsCookie() {
  return {
    createClearedAuthAndDeviceCookies: createClearedAuthAndDeviceCookiesMock,
  };
});

vi.mock("@/server/pocketbase/pocketbase-server", function mockPocketBaseServer() {
  return {
    createPocketBaseServerClient: createPocketBaseServerClientMock,
    exportPocketBaseAuthCookies: exportPocketBaseAuthCookiesMock,
  };
});

describe("auth-user-resolution", function describeAuthUserResolution() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("keeps render-time auth resolution read-only", async function testRenderResolver() {
    const context = createAuthResolutionContext();

    createPocketBaseServerClientMock.mockResolvedValue(context.client);
    resolveCurrentAuthDeviceSessionMock.mockResolvedValue({
      status: "valid",
      sessionIdHash: "session-hash-1",
    });
    context.usersCollection.getOne.mockResolvedValue(context.user);

    const response = await resolveRenderAuthenticatedUser();

    expect(resolveCurrentAuthDeviceSessionMock).toHaveBeenCalledWith({
      pb: context.pb,
      userId: context.user.id,
      mode: "read",
    });
    expect(context.usersCollection.getOne).toHaveBeenCalledWith(context.user.id);
    expect(context.usersCollection.authRefresh).not.toHaveBeenCalled();
    expect(exportPocketBaseAuthCookiesMock).not.toHaveBeenCalled();
    expect(response).toEqual({
      ok: true,
      pb: context.pb,
      user: context.user,
      currentSessionIdHash: "session-hash-1",
    });
  });

  it("keeps writable auth resolution on the write-capable device-session path", async function testWritableResolver() {
    const context = createAuthResolutionContext();

    createPocketBaseServerClientMock.mockResolvedValue(context.client);
    resolveCurrentAuthDeviceSessionMock.mockResolvedValue({
      status: "valid",
      sessionIdHash: "session-hash-1",
    });
    context.usersCollection.authRefresh.mockResolvedValue({
      record: context.user,
    });

    const response = await resolveWritableAuthenticatedUser();

    expect(resolveCurrentAuthDeviceSessionMock).toHaveBeenCalledWith({
      pb: context.pb,
      userId: context.user.id,
      mode: "write",
      shouldPersistSession: true,
    });
    expect(context.usersCollection.authRefresh).toHaveBeenCalledTimes(1);
    expect(context.usersCollection.getOne).not.toHaveBeenCalled();
    expect(response).toEqual({
      status: "authenticated",
      pb: context.pb,
      user: context.user,
      currentSessionIdHash: "session-hash-1",
      setCookie: ["pb_auth=token", "pb_persist=1"],
    });
  });

  it("returns auth metadata for unverified writable sessions", async function testWritableResolverUnverified() {
    const context = createAuthResolutionContext({
      shouldPersistSession: true,
    });

    createPocketBaseServerClientMock.mockResolvedValue(context.client);
    resolveCurrentAuthDeviceSessionMock.mockResolvedValue({
      status: "valid",
      sessionIdHash: "session-hash-1",
    });
    context.usersCollection.authRefresh.mockResolvedValue({
      record: createUserRecord("user-1", "user@example.com", {
        verified: false,
      }),
    });

    const response = await resolveWritableAuthenticatedUser();

    expect(exportPocketBaseAuthCookiesMock).toHaveBeenCalledWith(context.pb, {
      sessionOnly: false,
    });
    expect(createClearedAuthAndDeviceCookiesMock).not.toHaveBeenCalled();
    expect(response).toEqual({
      status: "unverified",
      setCookie: ["pb_auth=token", "pb_persist=1"],
    });
  });
});

function createAuthResolutionContext(input?: { shouldPersistSession?: boolean }) {
  const usersCollection = {
    authRefresh: vi.fn(),
    getOne: vi.fn(),
  };
  const user = createUserRecord("user-1", "user@example.com");
  const pb = {
    authStore: {
      isValid: true,
      record: user,
    },
    collection: vi.fn(function getCollection(name: string) {
      if (name !== "users") {
        throw new Error(`Unexpected collection: ${name}`);
      }

      return usersCollection;
    }),
  } as unknown as PocketBase;

  return {
    client: {
      pb,
      hasAuthCookie: true,
      hadInvalidAuthCookie: false,
      shouldPersistSession: input?.shouldPersistSession ?? true,
    },
    pb,
    user,
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
