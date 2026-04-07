import type PocketBase from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord } from "@/types/pocketbase";

vi.mock("@/server/pocketbase/pocketbase-server", function mockPocketBaseServer() {
  return {
    createPocketBaseServerClient: vi.fn(),
  };
});

vi.mock("@/server/device-sessions/device-sessions-cookie", function mockDeviceSessionCookie() {
  return {
    createClearedAuthAndDeviceCookies: vi.fn(),
    readDeviceSessionCookie: vi.fn(),
  };
});

vi.mock("@/server/device-sessions/device-sessions-service", function mockDeviceSessionService() {
  return {
    checkDeviceSessionReadOnly: vi.fn(),
    validateDeviceSessionOrInvalidate: vi.fn(),
  };
});

vi.mock("@/server/auth/auth-errors", function mockAuthErrors() {
  return {
    isTransientError: vi.fn(function isTransientError() {
      return false;
    }),
  };
});

import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import { readDeviceSessionCookie } from "@/server/device-sessions/device-sessions-cookie";
import {
  checkDeviceSessionReadOnly,
  validateDeviceSessionOrInvalidate,
} from "@/server/device-sessions/device-sessions-service";
import { requireCurrentActionUser, requireCurrentUser } from "./current-user";

describe("current-user", function describeCurrentUser() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("keeps render-time current-user checks read-only", async function testRequireCurrentUser() {
    const context = createCurrentUserContext();

    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    vi.mocked(readDeviceSessionCookie).mockResolvedValue("device-token");
    vi.mocked(checkDeviceSessionReadOnly).mockResolvedValue({
      status: "valid",
      sessionIdHash: "session-hash-1",
    });
    context.usersCollection.getOne.mockResolvedValue(context.user);

    const response = await requireCurrentUser();

    expect(response).toEqual({
      ok: true,
      pb: context.pb,
      user: context.user,
      currentSessionIdHash: "session-hash-1",
    });
    expect(checkDeviceSessionReadOnly).toHaveBeenCalledWith({
      pb: context.pb,
      userId: context.user.id,
      deviceSessionToken: "device-token",
    });
    expect(validateDeviceSessionOrInvalidate).not.toHaveBeenCalled();
    expect(context.usersCollection.authRefresh).not.toHaveBeenCalled();
  });

  it("keeps heartbeat updates in the action-only current-user path", async function testRequireCurrentActionUser() {
    const context = createCurrentUserContext({
      shouldPersistSession: false,
    });

    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    vi.mocked(readDeviceSessionCookie).mockResolvedValue("device-token");
    vi.mocked(validateDeviceSessionOrInvalidate).mockResolvedValue({
      status: "valid",
      sessionIdHash: "session-hash-1",
    });
    context.usersCollection.authRefresh.mockResolvedValue({
      record: context.user,
    });

    const response = await requireCurrentActionUser();

    expect(response).toEqual({
      ok: true,
      pb: context.pb,
      user: context.user,
      currentSessionIdHash: "session-hash-1",
    });
    expect(validateDeviceSessionOrInvalidate).toHaveBeenCalledWith({
      pb: context.pb,
      userId: context.user.id,
      deviceSessionToken: "device-token",
      shouldUpdateHeartbeat: true,
    });
    expect(checkDeviceSessionReadOnly).not.toHaveBeenCalled();
    expect(context.usersCollection.authRefresh).toHaveBeenCalledTimes(1);
  });
});

function createCurrentUserContext(input?: { shouldPersistSession?: boolean }) {
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

function createUserRecord(id: string, email: string): UsersRecord {
  return {
    id,
    avatar: "",
    collectionId: "users",
    collectionName: "users",
    created: "2026-01-01T00:00:00.000Z",
    email,
    name: "User",
    updated: "2026-01-01T00:00:00.000Z",
    verified: true,
  };
}
