import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";
import { evaluateAuthProxyGuard } from "./auth-proxy";

describe("auth-proxy", function describeAuthProxy() {
  it("redirects protected routes when the device session cookie is missing", function testMissingDeviceCookie() {
    const request = new NextRequest("https://app.test/cs/account");

    request.cookies.set("pb_auth", "token");

    expect(evaluateAuthProxyGuard(request)).toEqual({
      shouldRedirect: true,
      pathname: "/cs/prihlasit-se",
    });
  });

  it("allows protected routes when both auth cookies are present", function testBothCookiesPresent() {
    const request = new NextRequest("https://app.test/cs/account");

    request.cookies.set("pb_auth", "token");
    request.cookies.set("app_device_session", "device-token");

    expect(evaluateAuthProxyGuard(request)).toEqual({
      shouldRedirect: false,
    });
  });
});
