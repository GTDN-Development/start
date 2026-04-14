import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  resolveRenderAuthenticatedUser,
  resolveWritableAuthenticatedUser,
} from "@/server/auth/auth-user-resolution";
import { requireCurrentUser, requireCurrentWritableUser } from "./current-user";

vi.mock("@/server/auth/auth-user-resolution", function mockAuthUserResolution() {
  return {
    resolveRenderAuthenticatedUser: vi.fn(),
    resolveWritableAuthenticatedUser: vi.fn(),
  };
});

describe("current-user", function describeCurrentUser() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("delegates render-time auth resolution to the render resolver", async function testRequireCurrentUser() {
    vi.mocked(resolveRenderAuthenticatedUser).mockResolvedValue({
      ok: true,
      pb: "pb-client" as never,
      user: {
        id: "user-1",
        email: "user@example.com",
      } as never,
      currentSessionIdHash: "session-hash-1",
    });

    const response = await requireCurrentUser();

    expect(response).toEqual({
      ok: true,
      pb: "pb-client",
      user: {
        id: "user-1",
        email: "user@example.com",
      },
      currentSessionIdHash: "session-hash-1",
    });
    expect(resolveRenderAuthenticatedUser).toHaveBeenCalledTimes(1);
  });

  it("returns only the auth error code for render-time failures", async function testRequireCurrentUserFailure() {
    vi.mocked(resolveRenderAuthenticatedUser).mockResolvedValue({
      ok: false,
      errorCode: "UNAUTHORIZED",
    });

    const response = await requireCurrentUser();

    expect(response).toEqual({
      ok: false,
      errorCode: "UNAUTHORIZED",
    });
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
});
