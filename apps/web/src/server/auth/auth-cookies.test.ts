import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { applyServerActionAuthCookies, appendAuthCookiesToResponse } from "./auth-cookies";

type CookieStore = Awaited<ReturnType<typeof cookies>>;
const setCookie = vi.fn();

vi.mock("next/headers", function mockNextHeaders() {
  return {
    cookies: vi.fn(),
  };
});

describe("auth-cookies", function describeAuthCookies() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    vi.mocked(cookies).mockResolvedValue(createCookieStoreMock(setCookie));
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

function createCookieStoreMock(setCookieMock: typeof setCookie): CookieStore {
  return {
    [Symbol.iterator]: function* iterateCookies() {
      yield* [];
    },
    size: 0,
    get: vi.fn(),
    getAll: vi.fn(function getAllCookies() {
      return [];
    }),
    has: vi.fn(function hasCookie() {
      return false;
    }),
    set: setCookieMock as unknown as CookieStore["set"],
    delete: vi.fn() as unknown as CookieStore["delete"],
    toString: vi.fn(function stringifyCookies() {
      return "";
    }),
  } as CookieStore;
}
