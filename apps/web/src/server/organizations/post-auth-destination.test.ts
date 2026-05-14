import { beforeEach, describe, expect, it, vi } from "vitest";

const { getPendingInviteTokenCookieMock, resolveActiveOrganizationSlugMock } = vi.hoisted(
  function hoistPostAuthDestinationMocks() {
    return {
      getPendingInviteTokenCookieMock: vi.fn(),
      resolveActiveOrganizationSlugMock: vi.fn(),
    };
  }
);

vi.mock("@/server/organizations/organization-cookie", function mockOrganizationCookie() {
  return {
    getPendingInviteTokenCookie: getPendingInviteTokenCookieMock,
  };
});

vi.mock(
  "@/server/organizations/organization-navigation-queries",
  function mockOrganizationNavigationQueries() {
    return {
      resolveActiveOrganizationSlug: resolveActiveOrganizationSlugMock,
    };
  }
);

import { resolvePostAuthDestination } from "./post-auth-destination";

describe("post-auth-destination", function describePostAuthDestination() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("returns the app destination without reading organization state when organizations are disabled", async function testDisabledOrganizations() {
    await expect(resolvePostAuthDestination({ userId: "user-1" })).resolves.toEqual({
      ok: true,
      data: {
        state: "app",
      },
    });
    expect(getPendingInviteTokenCookieMock).not.toHaveBeenCalled();
    expect(resolveActiveOrganizationSlugMock).not.toHaveBeenCalled();
  });
});
