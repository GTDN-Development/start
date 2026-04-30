import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveCurrentServerAuth } from "@/server/auth/auth-user-resolution";
import { requireCurrentUser, requireCurrentWritableUser } from "./current-user";

vi.mock("@/server/auth/auth-user-resolution", function mockAuthUserResolution() {
  return {
    resolveCurrentServerAuth: vi.fn(),
  };
});

describe("current-user", function describeCurrentUser() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("returns the PocketBase client and user for authenticated read resolution", async function testRequireCurrentUserSuccess() {
    vi.mocked(resolveCurrentServerAuth).mockResolvedValue({
      status: "authenticated",
      pb: "pb-client" as never,
      user: {
        id: "user-1",
      } as never,
    });

    const response = await requireCurrentUser();

    expect(response).toEqual({
      ok: true,
      pb: "pb-client",
      user: {
        id: "user-1",
      },
    });
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
      isStale: true,
    });

    const response = await requireCurrentWritableUser();

    expect(response).toEqual({
      ok: false,
      errorCode: "UNKNOWN_ERROR",
    });
  });
});
