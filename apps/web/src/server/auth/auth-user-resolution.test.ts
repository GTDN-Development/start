import type PocketBase from "pocketbase";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { UsersRecord } from "@/types/pocketbase";

vi.mock("@/server/device-sessions/device-sessions-cookie", function mockDeviceSessionCookie() {
  return {
    createClearedAuthAndDeviceCookies: vi.fn(),
  };
});

vi.mock("@/server/device-sessions/device-sessions-service", function mockDeviceSessionsService() {
  return {
    resolveCurrentAuthDeviceSession: vi.fn(),
  };
});

vi.mock("@/server/pocketbase/pocketbase-server", function mockPocketBaseServer() {
  return {
    createPocketBaseServerClient: vi.fn(),
    exportPocketBaseAuthCookies: vi.fn(),
  };
});

import { createClearedAuthAndDeviceCookies } from "@/server/device-sessions/device-sessions-cookie";
import { resolveCurrentAuthDeviceSession } from "@/server/device-sessions/device-sessions-service";
import {
  createPocketBaseServerClient,
  exportPocketBaseAuthCookies,
} from "@/server/pocketbase/pocketbase-server";
import { resolveCurrentServerAuth } from "./auth-user-resolution";

describe("auth-user-resolution", function describeAuthUserResolution() {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(function suppressWarnLog() {
      return undefined;
    });
    vi.mocked(createClearedAuthAndDeviceCookies).mockReturnValue([
      "pb_auth=; Max-Age=0",
      "device_session=; Max-Age=0",
    ]);
    vi.mocked(exportPocketBaseAuthCookies).mockReturnValue(["pb_auth=token", "pb_persist=0"]);
  });

  afterEach(function restoreConsoleSpies() {
    consoleWarnSpy.mockRestore();
  });

  it("returns unauthorized without cookie metadata when read resolution hits an invalid device session", async function testReadInvalidDeviceSession() {
    const context = createAuthResolutionContext();

    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    vi.mocked(resolveCurrentAuthDeviceSession).mockResolvedValue({
      status: "invalid",
    });

    const response = await resolveCurrentServerAuth({
      mode: "read",
    });

    expect(response).toEqual({
      status: "unauthorized",
    });
  });

  it("returns unauthorized with cookie cleanup metadata for invalid auth cookies in write mode", async function testWriteInvalidAuthCookie() {
    const context = createAuthResolutionContext({
      authCookieState: "invalid",
    });

    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);

    const response = await resolveCurrentServerAuth({
      mode: "write",
    });

    expect(response).toEqual({
      status: "unauthorized",
      setCookie: ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"],
    });
  });

  it("returns unverified with rewritten auth cookies in write mode", async function testWriteUnverified() {
    const context = createAuthResolutionContext({
      shouldPersistSession: false,
    });

    context.usersCollection.authRefresh.mockResolvedValue({
      record: createUserRecord("user-1", "user@example.com", {
        verified: false,
      }),
    });
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    vi.mocked(resolveCurrentAuthDeviceSession).mockResolvedValue({
      status: "valid",
      sessionIdHash: "session-hash-1",
    });

    const response = await resolveCurrentServerAuth({
      mode: "write",
    });

    expect(response).toEqual({
      status: "unverified",
      setCookie: ["pb_auth=token", "pb_persist=0"],
    });
  });

  it("returns authenticated stale fallback when auth refresh fails transiently after a valid session", async function testWriteTransientFallback() {
    const context = createAuthResolutionContext();

    context.usersCollection.authRefresh.mockRejectedValue(new Error("temporary backend failure"));
    vi.mocked(createPocketBaseServerClient).mockResolvedValue(context.client);
    vi.mocked(resolveCurrentAuthDeviceSession).mockResolvedValue({
      status: "valid",
      sessionIdHash: "session-hash-1",
    });

    const response = await resolveCurrentServerAuth({
      mode: "write",
    });

    expect(response).toEqual({
      status: "authenticated",
      pb: context.pb,
      user: context.user,
      currentSessionIdHash: "session-hash-1",
      isStale: true,
    });
  });
});

function createAuthResolutionContext(input?: {
  authCookieState?: "missing" | "present" | "invalid";
  shouldPersistSession?: boolean;
}) {
  const user = createUserRecord("user-1", "user@example.com");
  const usersCollection = {
    authRefresh: vi.fn(),
    getOne: vi.fn(),
  };
  const pb = {
    authStore: {
      isValid: input?.authCookieState !== "invalid",
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
      authCookieState: input?.authCookieState ?? "present",
      pb,
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
