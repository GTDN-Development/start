import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveCurrentServerAuth } from "@/server/auth/auth-user-resolution";
import {
  listDeviceSessions,
  revokeDeviceSessionById,
} from "@/server/device-sessions/device-sessions-service";
import {
  listCurrentUserDeviceSessions,
  requireCurrentWritableUser,
  revokeCurrentUserDeviceSessionById,
} from "./current-user";

vi.mock("@/server/auth/auth-user-resolution", function mockAuthUserResolution() {
  return {
    resolveCurrentServerAuth: vi.fn(),
  };
});

vi.mock("@/server/device-sessions/device-sessions-service", function mockDeviceSessionsService() {
  return {
    listDeviceSessions: vi.fn(),
    revokeDeviceSessionById: vi.fn(),
  };
});

describe("current-user", function describeCurrentUser() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("keeps writable cookie cleanup metadata on auth failures", async function testRequireCurrentWritableUserFailure() {
    vi.mocked(resolveCurrentServerAuth).mockResolvedValue({
      status: "unauthorized",
      setCookie: ["pb_auth=; Max-Age=0"],
    });

    const response = await requireCurrentWritableUser();

    expect(response).toEqual({
      ok: false,
      errorCode: "UNAUTHORIZED",
      setCookie: ["pb_auth=; Max-Age=0"],
    });
  });

  it("maps stale authenticated write resolution to UNKNOWN_ERROR", async function testRequireCurrentWritableUserStale() {
    vi.mocked(resolveCurrentServerAuth).mockResolvedValue({
      status: "authenticated",
      pb: "pb-client" as never,
      user: {
        id: "user-1",
      } as never,
      currentSessionIdHash: "session-hash-1",
      isStale: true,
    });

    const response = await requireCurrentWritableUser();

    expect(response).toEqual({
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    });
  });

  it("loads device sessions through the current-user boundary", async function testListCurrentUserDeviceSessions() {
    vi.mocked(resolveCurrentServerAuth).mockResolvedValue({
      status: "authenticated",
      pb: "pb-client" as never,
      user: {
        id: "user-1",
      } as never,
      currentSessionIdHash: "session-hash-1",
    });
    vi.mocked(listDeviceSessions).mockResolvedValue([
      {
        id: "session-1",
        deviceLabel: "MacBook Pro",
        deviceType: "desktop",
        browser: "Chrome",
        os: "macOS",
        userAgent: "Mozilla/5.0",
        lastSeenAt: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
        isCurrentDevice: true,
      },
    ]);

    const response = await listCurrentUserDeviceSessions();

    expect(response).toEqual([
      expect.objectContaining({
        id: "session-1",
        isCurrentDevice: true,
      }),
    ]);
    expect(listDeviceSessions).toHaveBeenCalledWith({
      pb: "pb-client",
      userId: "user-1",
      currentSessionIdHash: "session-hash-1",
    });
  });

  it.each([
    {
      name: "maps missing device sessions to NOT_FOUND",
      revokeResult: "not_found" as const,
      expectedErrorCode: "NOT_FOUND" as const,
    },
    {
      name: "maps current-device revokes to BAD_REQUEST",
      revokeResult: "current_device" as const,
      expectedErrorCode: "BAD_REQUEST" as const,
    },
  ])("$name", async function testRevokeDeviceSessionMapping(input) {
    vi.mocked(resolveCurrentServerAuth).mockResolvedValue({
      status: "authenticated",
      pb: "pb-client" as never,
      user: {
        id: "user-1",
      } as never,
      currentSessionIdHash: "session-hash-1",
    });
    vi.mocked(revokeDeviceSessionById).mockResolvedValue(input.revokeResult);

    const response = await revokeCurrentUserDeviceSessionById({
      deviceSessionId: "session-1",
    });

    expect(response).toEqual({
      ok: false,
      errorCode: input.expectedErrorCode,
    });
  });
});
