import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { evaluateAuthProxyGuard } from "./auth-proxy";

describe("auth-proxy", function describeAuthProxy() {
  it("redirects protected routes when the PocketBase auth cookie is missing", function testMissingAuthCookie() {
    const request = new NextRequest("https://app.test/cs/account");

    expect(evaluateAuthProxyGuard(request)).toEqual({
      shouldRedirect: true,
      pathname: "/cs/prihlasit-se",
    });
  });

  it("allows protected routes when the PocketBase auth cookie is present", function testAuthCookiePresent() {
    const request = new NextRequest("https://app.test/cs/account");

    request.cookies.set("pb_auth", "token");

    expect(evaluateAuthProxyGuard(request)).toEqual({
      shouldRedirect: false,
    });
  });
});
