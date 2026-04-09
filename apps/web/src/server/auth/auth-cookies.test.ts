import { cookies } from "next/headers";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { authConfig } from "@/config/auth";
import { securityConfig } from "@/config/security";
import { applyServerActionAuthCookies } from "./auth-cookies";

type CookieStore = Awaited<ReturnType<typeof cookies>>;
const setCookie = vi.fn();
const AUTH_COOKIE_NAME = authConfig.cookies.authCookieName;
const DEVICE_COOKIE_NAME = securityConfig.deviceSessions.cookieName;

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
      `${AUTH_COOKIE_NAME}=token; Path=/; HttpOnly; SameSite=Lax`,
      `${DEVICE_COOKIE_NAME}=; Max-Age=0; Path=/; HttpOnly`,
    ]);

    expect(setCookie).toHaveBeenNthCalledWith(1, {
      name: AUTH_COOKIE_NAME,
      value: "token",
      path: "/",
      httpOnly: true,
      sameSite: "lax",
    });
    expect(setCookie).toHaveBeenNthCalledWith(2, {
      name: DEVICE_COOKIE_NAME,
      value: "",
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
    });
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
