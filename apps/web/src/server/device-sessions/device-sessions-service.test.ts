import PocketBase, { ClientResponseError } from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserDeviceSessionsRecord } from "@/types/pocketbase";
import {
  DEVICE_SESSION_PERSISTENT_MAX_AGE_SECONDS,
  DEVICE_SESSION_SESSION_ONLY_MAX_AGE_SECONDS,
  HEARTBEAT_MIN_SECONDS,
  MAX_ACTIVE_SESSIONS,
} from "@/server/device-sessions/device-sessions-types";

vi.mock("@/server/device-sessions/device-sessions-cookie", function mockDeviceSessionCookie() {
  return {
    createClearedAuthAndDeviceCookies: vi.fn(() => [
      "pb_auth=; Max-Age=0",
      "device_session=; Max-Age=0",
    ]),
    createDeviceSessionCookie: vi.fn((token: string) => `device_session=${token}`),
    generateDeviceSessionCookie: vi.fn(() => ({
      token: "generated-device-token",
      setCookie: "device_session=generated-device-token",
    })),
    readDeviceSessionCookie: vi.fn(),
  };
});

vi.mock("@/server/device-sessions/device-sessions-ua-parser", function mockUaParser() {
  return {
    parseDeviceInfo: vi.fn(),
  };
});

import { readDeviceSessionCookie } from "@/server/device-sessions/device-sessions-cookie";
import { parseDeviceInfo } from "@/server/device-sessions/device-sessions-ua-parser";
import {
  hashSessionToken,
  listDeviceSessions,
  registerOrRefreshDeviceSession,
  resolveCurrentAuthDeviceSession,
  revokeDeviceSessionById,
  revokeOtherDeviceSessions,
} from "./device-sessions-service";

describe("device-sessions-service", function describeDeviceSessionsService() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    vi.mocked(parseDeviceInfo).mockReturnValue({
      deviceLabel: "MacBook Pro",
      deviceType: "desktop",
      browser: "Chrome",
      os: "macOS",
    });
  });

  it("lists only active sessions and marks the current device", async function testListActiveSessions() {
    const { pb, getFullListSpy } = createPocketBaseMock();
    const currentSessionHash = hashSessionToken("current-session-token");

    getFullListSpy.mockResolvedValue([
      createDeviceSessionRecord("session-current", {
        sessionIdHash: currentSessionHash,
        expiresAt: createFutureIso(60),
      }),
      createDeviceSessionRecord("session-other", {
        sessionIdHash: hashSessionToken("other-session-token"),
        expiresAt: createFutureIso(120),
      }),
      createDeviceSessionRecord("session-expired", {
        sessionIdHash: hashSessionToken("expired-session-token"),
        expiresAt: createPastIso(60),
      }),
    ]);

    const response = await listDeviceSessions({
      pb,
      userId: "user-1",
      currentSessionIdHash: currentSessionHash,
    });

    expect(
      response.map(function mapSession(session) {
        return {
          id: session.id,
          isCurrentDevice: session.isCurrentDevice,
        };
      })
    ).toEqual([
      { id: "session-current", isCurrentDevice: true },
      { id: "session-other", isCurrentDevice: false },
    ]);
  });

  it.each([
    {
      name: "rejects revoking the current device by id",
      deviceSession: createDeviceSessionRecord("session-current", {
        sessionIdHash: hashSessionToken("current-session-token"),
        expiresAt: createFutureIso(60),
      }),
      expected: "current_device",
      shouldDelete: false,
    },
    {
      name: "returns not_found when the device session does not exist",
      deviceSession: createClientResponseError(404),
      expected: "not_found",
      shouldDelete: false,
    },
    {
      name: "revokes another active device by id",
      deviceSession: createDeviceSessionRecord("session-other", {
        sessionIdHash: hashSessionToken("other-session-token"),
        expiresAt: createFutureIso(60),
      }),
      expected: "revoked",
      shouldDelete: true,
    },
  ])("$name", async function testRevokeDeviceSessionById(input) {
    const { pb, deleteSpy, getOneSpy } = createPocketBaseMock();

    if (input.deviceSession instanceof Error) {
      getOneSpy.mockRejectedValue(input.deviceSession);
    } else {
      getOneSpy.mockResolvedValue(input.deviceSession);
    }

    const response = await revokeDeviceSessionById({
      pb,
      userId: "user-1",
      deviceSessionId: "session-target",
      currentSessionIdHash: hashSessionToken("current-session-token"),
    });

    expect(response).toBe(input.expected);
    expect(deleteSpy).toHaveBeenCalledTimes(input.shouldDelete ? 1 : 0);
  });

  it("revokes only other active sessions and returns their count", async function testRevokeOthers() {
    const { pb, deleteSpy, getFullListSpy } = createPocketBaseMock();
    const currentSessionHash = hashSessionToken("current-session-token");

    getFullListSpy.mockResolvedValue([
      createDeviceSessionRecord("session-current", {
        sessionIdHash: currentSessionHash,
        expiresAt: createFutureIso(60),
      }),
      createDeviceSessionRecord("session-other-active", {
        sessionIdHash: hashSessionToken("other-active"),
        expiresAt: createFutureIso(120),
      }),
      createDeviceSessionRecord("session-other-expired", {
        sessionIdHash: hashSessionToken("other-expired"),
        expiresAt: createPastIso(120),
      }),
    ]);

    const revokedCount = await revokeOtherDeviceSessions({
      pb,
      userId: "user-1",
      currentSessionIdHash: currentSessionHash,
    });

    expect(revokedCount).toBe(1);
    expect(deleteSpy.mock.calls.flat()).toEqual(["session-other-active"]);
  });

  it("keeps read-only invalid-session checks side-effect free", async function testReadInvalidSession() {
    const { pb, deleteSpy, getFirstListItemSpy } = createPocketBaseMock();

    vi.mocked(readDeviceSessionCookie).mockResolvedValue("expired-session-token");
    getFirstListItemSpy.mockResolvedValue(
      createDeviceSessionRecord("session-expired", {
        sessionIdHash: hashSessionToken("expired-session-token"),
        expiresAt: createPastIso(60),
      })
    );

    const response = await resolveCurrentAuthDeviceSession({
      pb,
      userId: "user-1",
      mode: "read",
    });

    expect(response).toEqual({
      status: "invalid",
    });
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("clears cookies and deletes stale owned sessions in write mode", async function testWriteInvalidSession() {
    const { pb, deleteSpy, getFirstListItemSpy } = createPocketBaseMock();

    vi.mocked(readDeviceSessionCookie).mockResolvedValue("expired-session-token");
    getFirstListItemSpy.mockResolvedValue(
      createDeviceSessionRecord("session-expired", {
        sessionIdHash: hashSessionToken("expired-session-token"),
        expiresAt: createPastIso(60),
      })
    );

    const response = await resolveCurrentAuthDeviceSession({
      pb,
      userId: "user-1",
      mode: "write",
      shouldPersistSession: true,
    });

    expect(response).toEqual({
      status: "invalid",
      setCookie: ["pb_auth=; Max-Age=0", "device_session=; Max-Age=0"],
    });
    expect(deleteSpy).toHaveBeenCalledWith("session-expired");
  });

  it("updates an existing session and enforces the device limit while cleaning expired sessions", async function testRegisterOrRefreshExistingSession() {
    const { pb, deleteSpy, getFirstListItemSpy, getFullListSpy, updateSpy } =
      createPocketBaseMock();
    const maxActiveSessions = getMaxActiveSessionsForTest();
    const currentSessionHash = hashSessionToken("current-session-token");
    const existingSession = createDeviceSessionRecord("session-current", {
      sessionIdHash: currentSessionHash,
      expiresAt: createFutureIso(60),
    });
    const oldestSession = createDeviceSessionRecord("session-oldest", {
      sessionIdHash: hashSessionToken("session-oldest-token"),
      expiresAt: createFutureIso(120),
      created: "2026-01-01T00:00:00.000Z",
      lastSeenAt: "2026-01-01T00:00:00.000Z",
    });

    getFirstListItemSpy.mockResolvedValue(existingSession);
    getFullListSpy
      .mockResolvedValueOnce([
        oldestSession,
        existingSession,
        ...createActiveDeviceSessions(maxActiveSessions - 1),
      ])
      .mockResolvedValueOnce([
        existingSession,
        createDeviceSessionRecord("session-expired", {
          sessionIdHash: hashSessionToken("session-expired-token"),
          expiresAt: createPastIso(60),
        }),
      ]);

    await registerOrRefreshDeviceSession({
      pb,
      userId: "user-1",
      sessionToken: "current-session-token",
      shouldPersistSession: true,
      requestHeaders: new Headers({
        "user-agent": "Mozilla/5.0",
      }),
    });

    expect(updateSpy).toHaveBeenCalledOnce();
    const updateCall = updateSpy.mock.calls.at(0);

    if (!updateCall) {
      throw new Error("Expected the existing session to be updated.");
    }

    const [updatedSessionId, updatePayload] = updateCall;

    expect(updatedSessionId).toBe(existingSession.id);
    expect(deleteSpy.mock.calls.flat()).toEqual(["session-oldest", "session-expired"]);
    expectExpiresAtWithinTtl(
      getExpiresAtFromWrite(updatePayload),
      DEVICE_SESSION_PERSISTENT_MAX_AGE_SECONDS
    );
  });

  it("uses the short TTL for session-only registration and heartbeat", async function testSessionOnlyTtl() {
    const { pb, createSpy, getFirstListItemSpy, getFullListSpy, updateSpy } =
      createPocketBaseMock();
    const sessionToken = "session-only-token";

    vi.mocked(readDeviceSessionCookie).mockResolvedValue(sessionToken);
    getFirstListItemSpy.mockRejectedValueOnce(createClientResponseError(404)).mockResolvedValueOnce(
      createDeviceSessionRecord("session-current", {
        sessionIdHash: hashSessionToken(sessionToken),
        expiresAt: createFutureIso(DEVICE_SESSION_SESSION_ONLY_MAX_AGE_SECONDS),
        lastSeenAt: createPastIso(HEARTBEAT_MIN_SECONDS + 60),
      })
    );
    getFullListSpy.mockResolvedValue([]);

    await registerOrRefreshDeviceSession({
      pb,
      userId: "user-1",
      sessionToken,
      shouldPersistSession: false,
      requestHeaders: new Headers({
        "user-agent": "Mozilla/5.0",
      }),
    });

    await resolveCurrentAuthDeviceSession({
      pb,
      userId: "user-1",
      mode: "write",
      shouldPersistSession: false,
    });

    expect(createSpy).toHaveBeenCalledTimes(1);
    expect(updateSpy).toHaveBeenCalledTimes(1);
    const createCall = createSpy.mock.calls.at(0);
    const updateCall = updateSpy.mock.calls.at(0);

    if (!createCall || !updateCall) {
      throw new Error("Expected both the registration write and heartbeat write to run.");
    }

    const [createPayload] = createCall;
    const [, heartbeatPayload] = updateCall;

    expectExpiresAtWithinTtl(
      getExpiresAtFromWrite(createPayload),
      DEVICE_SESSION_SESSION_ONLY_MAX_AGE_SECONDS
    );
    expectExpiresAtWithinTtl(
      getExpiresAtFromWrite(heartbeatPayload),
      DEVICE_SESSION_SESSION_ONLY_MAX_AGE_SECONDS
    );
  });
});

function createPocketBaseMock() {
  const createSpy = vi.fn(async function createRecord(_payload: unknown) {
    return undefined;
  });
  const deleteSpy = vi.fn(async function deleteRecord(_id: string) {
    return undefined;
  });
  const getFirstListItemSpy = vi.fn();
  const getFullListSpy = vi.fn();
  const getOneSpy = vi.fn();
  const updateSpy = vi.fn(async function updateRecord(_id: string, _payload: unknown) {
    return undefined;
  });

  return {
    pb: {
      collection: vi.fn(function getCollection() {
        return {
          create: createSpy,
          delete: deleteSpy,
          getFirstListItem: getFirstListItemSpy,
          getFullList: getFullListSpy,
          getOne: getOneSpy,
          update: updateSpy,
        };
      }),
    } as unknown as PocketBase,
    createSpy,
    deleteSpy,
    getFirstListItemSpy,
    getFullListSpy,
    getOneSpy,
    updateSpy,
  };
}

function createDeviceSessionRecord(
  id: string,
  input: {
    expiresAt: string;
    sessionIdHash: string;
    created?: string;
    lastSeenAt?: string;
    userId?: string;
  }
): UserDeviceSessionsRecord {
  return {
    id,
    collectionId: "user_device_sessions",
    collectionName: "user_device_sessions",
    created: input.created ?? "2026-01-02T00:00:00.000Z",
    updated: "2026-01-02T00:00:00.000Z",
    browser: "Chrome",
    device_label: "MacBook Pro",
    device_type: "desktop",
    expires_at: input.expiresAt,
    last_seen_at: input.lastSeenAt ?? "2026-01-02T00:00:00.000Z",
    os: "macOS",
    session_id_hash: input.sessionIdHash,
    user: input.userId ?? "user-1",
    user_agent: "Mozilla/5.0",
  };
}

function createFutureIso(secondsFromNow: number): string {
  return new Date(Date.now() + secondsFromNow * 1000).toISOString();
}

function createPastIso(secondsAgo: number): string {
  return new Date(Date.now() - secondsAgo * 1000).toISOString();
}

function createActiveDeviceSessions(count: number) {
  return Array.from({ length: count }, function createExtraSession(_, index) {
    return createDeviceSessionRecord(`session-active-${index + 1}`, {
      sessionIdHash: hashSessionToken(`session-active-token-${index + 1}`),
      expiresAt: createFutureIso(180 + index),
      created: `2026-01-01T00:0${index + 1}:00.000Z`,
      lastSeenAt: `2026-01-01T00:0${index + 1}:00.000Z`,
    });
  });
}

function expectExpiresAtWithinTtl(expiresAt: unknown, ttlSeconds: number) {
  expect(typeof expiresAt).toBe("string");

  const expiresAtMs = new Date(expiresAt as string).getTime();
  const ttlMs = ttlSeconds * 1000;
  const diffMs = expiresAtMs - Date.now();

  expect(diffMs).toBeGreaterThanOrEqual(ttlMs - 2_000);
  expect(diffMs).toBeLessThanOrEqual(ttlMs + 2_000);
}

function getExpiresAtFromWrite(writePayload: unknown) {
  expect(writePayload).toBeTruthy();

  if (!writePayload || typeof writePayload !== "object" || !("expires_at" in writePayload)) {
    throw new Error("Expected a write payload with expires_at");
  }

  return writePayload.expires_at;
}

function getMaxActiveSessionsForTest(): number {
  if (MAX_ACTIVE_SESSIONS === null) {
    throw new Error("This test requires a numeric MAX_ACTIVE_SESSIONS value.");
  }

  return MAX_ACTIVE_SESSIONS;
}

function createClientResponseError(status: number) {
  return new ClientResponseError({
    message: `HTTP ${status}`,
    response: {},
    status,
    url: "http://localhost:8090/api/test",
  });
}
