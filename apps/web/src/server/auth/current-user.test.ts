import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resolveRenderAuthenticatedUser,
  resolveWritableAuthenticatedUser,
} from "@/server/auth/auth-user-resolution";
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
    resolveRenderAuthenticatedUser: vi.fn(),
    resolveWritableAuthenticatedUser: vi.fn(),
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
    vi.mocked(resolveWritableAuthenticatedUser).mockResolvedValue({
      status: "unauthorized",
      setCookie: ["pb_auth=; Max-Age=0"],
    });

    const response = await requireCurrentWritableUser();

    expect(response).toEqual({
      ok: false,
      errorCode: "UNAUTHORIZED",
      setCookie: ["pb_auth=; Max-Age=0"],
    });
    expect(resolveWritableAuthenticatedUser).toHaveBeenCalledTimes(1);
  });

  it("loads device sessions through the current-user boundary", async function testListCurrentUserDeviceSessions() {
    vi.mocked(resolveRenderAuthenticatedUser).mockResolvedValue({
      ok: true,
      pb: "pb-client" as never,
      user: {
        id: "user-1",
        email: "user@example.com",
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

  it("keeps writable auth cleanup cookies when revoking device sessions fails authorization", async function testRevokeCurrentUserDeviceSessionAuthFailure() {
    vi.mocked(resolveWritableAuthenticatedUser).mockResolvedValue({
      status: "unauthorized",
      setCookie: ["pb_auth=; Max-Age=0"],
    });

    const response = await revokeCurrentUserDeviceSessionById({
      deviceSessionId: "session-2",
    });

    expect(response).toEqual({
      ok: false,
      errorCode: "UNAUTHORIZED",
      setCookie: ["pb_auth=; Max-Age=0"],
    });
    expect(revokeDeviceSessionById).not.toHaveBeenCalled();
  });

  it("maps missing device sessions to NOT_FOUND", async function testRevokeCurrentUserDeviceSessionNotFound() {
    vi.mocked(resolveWritableAuthenticatedUser).mockResolvedValue({
      status: "authenticated",
      pb: "pb-client" as never,
      user: {
        id: "user-1",
        email: "user@example.com",
      } as never,
      currentSessionIdHash: "session-hash-1",
    });
    vi.mocked(revokeDeviceSessionById).mockResolvedValue("not_found");

    const response = await revokeCurrentUserDeviceSessionById({
      deviceSessionId: "session-2",
    });

    expect(response).toEqual({
      ok: false,
      errorCode: "NOT_FOUND",
    });
  });

  it("maps current-device revokes to BAD_REQUEST", async function testRevokeCurrentUserDeviceSessionCurrentDevice() {
    vi.mocked(resolveWritableAuthenticatedUser).mockResolvedValue({
      status: "authenticated",
      pb: "pb-client" as never,
      user: {
        id: "user-1",
        email: "user@example.com",
      } as never,
      currentSessionIdHash: "session-hash-1",
    });
    vi.mocked(revokeDeviceSessionById).mockResolvedValue("current_device");

    const response = await revokeCurrentUserDeviceSessionById({
      deviceSessionId: "session-1",
    });

    expect(response).toEqual({
      ok: false,
      errorCode: "BAD_REQUEST",
    });
  });
});
