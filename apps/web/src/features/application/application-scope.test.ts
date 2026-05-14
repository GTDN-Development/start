import { describe, expect, it } from "vitest";
import { getOrganizationSlugFromPathname } from "./application-scope";

describe("application-scope", function describeApplicationScope() {
  it("resolves organization slugs from organization paths and ignores placeholders", function testOrganizationSlug() {
    expect(getOrganizationSlugFromPathname("/o/team/overview")).toBe("team");
    expect(getOrganizationSlugFromPathname("/o/[organizationSlug]/overview")).toBeNull();
  });
});
