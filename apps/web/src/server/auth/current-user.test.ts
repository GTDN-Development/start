import { beforeEach, describe, expect, it, vi } from "vitest";
import { resolveAuthenticatedUser } from "@/server/auth/auth-user-resolution";
import { requireCurrentActionUser, requireCurrentUser } from "./current-user";

vi.mock("@/server/auth/auth-user-resolution", function mockAuthUserResolution() {
  return {
    resolveAuthenticatedUser: vi.fn(),
  };
});

describe("current-user", function describeCurrentUser() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("delegates render-time auth resolution to the auth evaluator", async function testRequireCurrentUser() {
    vi.mocked(resolveAuthenticatedUser).mockResolvedValue({
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
    expect(resolveAuthenticatedUser).toHaveBeenCalledWith({
      mode: "render",
    });
  });

  it("returns only the auth error code for render-time failures", async function testRequireCurrentUserFailure() {
    vi.mocked(resolveAuthenticatedUser).mockResolvedValue({
      ok: false,
      errorCode: "UNAUTHORIZED",
    });

    const response = await requireCurrentUser();

    expect(response).toEqual({
      ok: false,
      errorCode: "UNAUTHORIZED",
    });
  });

  it("keeps action-only cookie cleanup metadata on auth failures", async function testRequireCurrentActionUserFailure() {
    vi.mocked(resolveAuthenticatedUser).mockResolvedValue({
      ok: false,
      errorCode: "UNAUTHORIZED",
      setCookie: ["pb_auth=; Max-Age=0"],
    });

    const response = await requireCurrentActionUser();

    expect(response).toEqual({
      ok: false,
      errorCode: "UNAUTHORIZED",
      setCookie: ["pb_auth=; Max-Age=0"],
    });
    expect(resolveAuthenticatedUser).toHaveBeenCalledWith({
      mode: "action",
    });
  });
});
