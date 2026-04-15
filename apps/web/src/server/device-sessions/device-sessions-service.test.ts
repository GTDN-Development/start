import PocketBase, { ClientResponseError } from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { UserDeviceSessionsRecord } from "@/types/pocketbase";
import {
  DEVICE_SESSION_PERSISTENT_MAX_AGE_SECONDS,
  DEVICE_SESSION_SESSION_ONLY_MAX_AGE_SECONDS,
  HEARTBEAT_MIN_SECONDS,
  MAX_ACTIVE_SESSIONS,
} from "@/server/device-sessions/device-sessions-types";

vi.mock("@/server/device-sessions/device-sessions-ua-parser", function mockUaParser() {
  return {
    parseDeviceInfo: vi.fn(),
  };
});

import { parseDeviceInfo } from "@/server/device-sessions/device-sessions-ua-parser";
import {
  hashSessionToken,
  listDeviceSessions,
  registerOrRefreshDeviceSession,
  revokeCurrentDeviceSession,
  revokeDeviceSessionById,
  revokeOtherDeviceSessions,
  validateDeviceSessionOrInvalidate,
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

    expect(response).toEqual([
      expect.objectContaining({
        id: "session-current",
        isCurrentDevice: true,
      }),
      expect.objectContaining({
        id: "session-other",
        isCurrentDevice: false,
      }),
    ]);
    expect(getFullListSpy).toHaveBeenCalledWith({
      filter: 'user = "user-1"',
      sort: "-last_seen_at",
    });
  });

  it("revokes the current active device session", async function testRevokeCurrentSession() {
    const { pb, deleteSpy, getFirstListItemSpy } = createPocketBaseMock();
    const currentSessionHash = hashSessionToken("current-session-token");

    getFirstListItemSpy.mockResolvedValue(
      createDeviceSessionRecord("session-current", {
        sessionIdHash: currentSessionHash,
        expiresAt: createFutureIso(60),
      })
    );

    await revokeCurrentDeviceSession({
      pb,
      userId: "user-1",
      currentSessionIdHash: currentSessionHash,
    });

    expect(deleteSpy).toHaveBeenCalledWith("session-current");
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
    expect(deleteSpy).toHaveBeenCalledTimes(1);
    expect(deleteSpy).toHaveBeenCalledWith("session-other-active");
  });

  it("returns current_device when revoking the current session by id", async function testRevokeByIdCurrentDevice() {
    const { pb, deleteSpy, getOneSpy } = createPocketBaseMock();
    const currentSessionHash = hashSessionToken("current-session-token");

    getOneSpy.mockResolvedValue(
      createDeviceSessionRecord("session-current", {
        sessionIdHash: currentSessionHash,
        expiresAt: createFutureIso(60),
      })
    );

    const response = await revokeDeviceSessionById({
      pb,
      userId: "user-1",
      deviceSessionId: "session-current",
      currentSessionIdHash: currentSessionHash,
    });

    expect(response).toBe("current_device");
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("returns not_found when the device session does not exist", async function testRevokeByIdNotFound() {
    const { pb, deleteSpy, getOneSpy } = createPocketBaseMock();

    getOneSpy.mockRejectedValue(createClientResponseError(404));

    const response = await revokeDeviceSessionById({
      pb,
      userId: "user-1",
      deviceSessionId: "missing-session",
      currentSessionIdHash: hashSessionToken("current-session-token"),
    });

    expect(response).toBe("not_found");
    expect(deleteSpy).not.toHaveBeenCalled();
  });

  it("revokes another active device session by id", async function testRevokeByIdOtherDevice() {
    const { pb, deleteSpy, getOneSpy } = createPocketBaseMock();

    getOneSpy.mockResolvedValue(
      createDeviceSessionRecord("session-other", {
        sessionIdHash: hashSessionToken("other-session-token"),
        expiresAt: createFutureIso(60),
      })
    );

    const response = await revokeDeviceSessionById({
      pb,
      userId: "user-1",
      deviceSessionId: "session-other",
      currentSessionIdHash: hashSessionToken("current-session-token"),
    });

    expect(response).toBe("revoked");
    expect(deleteSpy).toHaveBeenCalledWith("session-other");
  });

  it("updates an existing session and enforces the device limit without creating duplicates", async function testRegisterOrRefreshExistingSession() {
    const { pb, createSpy, deleteSpy, getFirstListItemSpy, getFullListSpy, updateSpy } =
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
    const activeSessions = [
      oldestSession,
      existingSession,
      ...Array.from({ length: maxActiveSessions - 1 }, function createExtraSession(_, index) {
        return createDeviceSessionRecord(`session-active-${index + 1}`, {
          sessionIdHash: hashSessionToken(`session-active-token-${index + 1}`),
          expiresAt: createFutureIso(180 + index),
          created: `2026-01-01T00:0${index + 1}:00.000Z`,
          lastSeenAt: `2026-01-01T00:0${index + 1}:00.000Z`,
        });
      }),
    ];
    const expiredSession = createDeviceSessionRecord("session-expired", {
      sessionIdHash: hashSessionToken("session-expired-token"),
      expiresAt: createPastIso(60),
    });

    getFirstListItemSpy.mockResolvedValue(existingSession);
    getFullListSpy
      .mockResolvedValueOnce(activeSessions)
      .mockResolvedValueOnce([existingSession, expiredSession]);

    await registerOrRefreshDeviceSession({
      pb,
      userId: "user-1",
      sessionToken: "current-session-token",
      shouldPersistSession: true,
      requestHeaders: new Headers({
        "user-agent": "Mozilla/5.0",
      }),
    });

    expect(createSpy).not.toHaveBeenCalled();
    expect(updateSpy).toHaveBeenCalledWith(
      existingSession.id,
      expect.objectContaining({
        user: "user-1",
        session_id_hash: currentSessionHash,
        device_label: "MacBook Pro",
        device_type: "desktop",
        browser: "Chrome",
        os: "macOS",
        user_agent: "Mozilla/5.0",
      })
    );
    expect(getFullListSpy).toHaveBeenNthCalledWith(1, {
      filter: 'user = "user-1"',
      sort: "+last_seen_at",
    });
    expect(getFullListSpy).toHaveBeenNthCalledWith(2, {
      filter: 'user = "user-1"',
    });
    expect(deleteSpy.mock.calls).toEqual([["session-oldest"], ["session-expired"]]);
    expectExpiresAtWithinTtl(
      getExpiresAtFromCall(updateSpy, 1),
      DEVICE_SESSION_PERSISTENT_MAX_AGE_SECONDS
    );
  });

  it("uses the short TTL for session-only registration and heartbeat", async function testSessionOnlyTtl() {
    const { pb, createSpy, getFirstListItemSpy, getFullListSpy, updateSpy } = createPocketBaseMock();
    const sessionToken = "session-only-token";

    getFirstListItemSpy
      .mockRejectedValueOnce(createClientResponseError(404))
      .mockResolvedValueOnce(
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

    expect(createSpy).toHaveBeenCalledTimes(1);
    expectExpiresAtWithinTtl(
      getExpiresAtFromCall(createSpy, 0),
      DEVICE_SESSION_SESSION_ONLY_MAX_AGE_SECONDS
    );

    await validateDeviceSessionOrInvalidate({
      pb,
      userId: "user-1",
      deviceSessionToken: sessionToken,
      shouldUpdateHeartbeat: true,
      shouldPersistSession: false,
    });

    expect(updateSpy).toHaveBeenCalledTimes(1);
    expectExpiresAtWithinTtl(
      getNthExpiresAtFromCall(updateSpy, 0, 1),
      DEVICE_SESSION_SESSION_ONLY_MAX_AGE_SECONDS
    );
  });
});

function createPocketBaseMock() {
  const createSpy = vi.fn(async function createRecord() {
    return undefined;
  });
  const deleteSpy = vi.fn(async function deleteRecord() {
    return undefined;
  });
  const getFirstListItemSpy = vi.fn();
  const getFullListSpy = vi.fn();
  const getOneSpy = vi.fn();
  const updateSpy = vi.fn(async function updateRecord() {
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

function expectExpiresAtWithinTtl(expiresAt: unknown, ttlSeconds: number) {
  expect(typeof expiresAt).toBe("string");

  const expiresAtMs = new Date(expiresAt as string).getTime();
  const ttlMs = ttlSeconds * 1000;
  const diffMs = expiresAtMs - Date.now();

  expect(diffMs).toBeGreaterThanOrEqual(ttlMs - 2_000);
  expect(diffMs).toBeLessThanOrEqual(ttlMs + 2_000);
}

function getExpiresAtFromCall(spy: ReturnType<typeof vi.fn>, payloadIndex: number) {
  return getNthExpiresAtFromCall(spy, 0, payloadIndex);
}

function getNthExpiresAtFromCall(
  spy: ReturnType<typeof vi.fn>,
  callIndex: number,
  payloadIndex: number
) {
  const payload = spy.mock.calls[callIndex]?.[payloadIndex];

  expect(payload).toBeTruthy();

  if (!payload || typeof payload !== "object" || !("expires_at" in payload)) {
    throw new Error("Expected a write payload with expires_at");
  }

  return payload.expires_at;
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
