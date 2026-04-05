import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyServerActionAuthCookies, appendAuthCookiesToResponse } from "./auth-cookies";

vi.mock("next/headers", function mockNextHeaders() {
  return {
    cookies: vi.fn(),
  };
});

describe("auth-cookies", function describeAuthCookies() {
  const setCookie = vi.fn();

  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue({
      set: setCookie,
    } as Awaited<ReturnType<typeof cookies>>);
  });

  it("applies serialized auth cookies inside server actions", async function testServerActionWriter() {
    await applyServerActionAuthCookies([
      "pb_auth=token; Path=/; HttpOnly; SameSite=Lax",
      "device_session=; Max-Age=0; Path=/; HttpOnly",
    ]);

    expect(setCookie).toHaveBeenNthCalledWith(1, {
      name: "pb_auth",
      value: "token",
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    expect(setCookie).toHaveBeenNthCalledWith(2, {
      name: "device_session",
      value: "",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
    });
  });

  it("appends serialized auth cookies to route handler responses", function testRouteHandlerWriter() {
    const response = NextResponse.redirect(new URL("https://example.com/cs/sign-in"), {
      status: 303,
    });

    appendAuthCookiesToResponse(response, ["pb_auth=token; Path=/; HttpOnly; SameSite=Lax"]);

    expect(response.headers.get("set-cookie")).toContain("pb_auth=token");
  });
});
