import { describe, expect, it } from "vitest";
import { cookieCatalog, cookiePolicy } from "./legal/cookies";

describe("legal cookie catalog", function describeLegalCookieCatalog() {
  it("documents Turnstile and keeps marketing cookies disabled", function testTurnstileAndMarketingCookieCatalog() {
    expect(cookiePolicy.hasMarketing).toBe(false);
    expect(cookieCatalog.some((cookie) => cookie.purposeKey === "turnstileSecurity")).toBe(true);
    expect(cookieCatalog.some((cookie) => cookie.category === "marketing")).toBe(false);
  });

  it("treats the active organization cookie as necessary app state", function testActiveOrganizationCookieCategory() {
    const activeOrganizationCookie = cookieCatalog.find(
      (cookie) => cookie.name === "active_organization"
    );

    expect(activeOrganizationCookie).toMatchObject({
      category: "essential",
      requiresConsent: false,
    });
  });
});
