import { RedirectType } from "next/navigation";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_HOME_PATH, getOrganizationOverviewHref } from "@/config/routes";
import type { SwitchApplicationScopeInput } from "./application-scope-actions";

const {
  applyServerActionAuthCookies,
  clearActiveOrganizationSlugCookie,
  redirect,
  requireCurrentWritableUser,
  resolveAccessibleOrganizationForCurrentUser,
  setActiveOrganizationSlugCookie,
} = vi.hoisted(function hoistApplicationScopeActionMocks() {
  return {
    applyServerActionAuthCookies: vi.fn(),
    clearActiveOrganizationSlugCookie: vi.fn(),
    redirect: vi.fn(),
    requireCurrentWritableUser: vi.fn(),
    resolveAccessibleOrganizationForCurrentUser: vi.fn(),
    setActiveOrganizationSlugCookie: vi.fn(),
  };
});

vi.mock("@/i18n/navigation", function mockNavigation() {
  return {
    redirect,
  };
});

vi.mock("@/server/auth/auth-cookies", function mockAuthCookies() {
  return {
    applyServerActionAuthCookies,
  };
});

vi.mock("@/server/auth/auth-session-service", function mockAuthSessionService() {
  return {
    requireCurrentWritableUser,
  };
});

vi.mock("@/server/organizations/organization-cookie", function mockOrganizationCookie() {
  return {
    clearActiveOrganizationSlugCookie,
    setActiveOrganizationSlugCookie,
  };
});

vi.mock(
  "@/server/organizations/organization-route-queries",
  function mockOrganizationRouteQueries() {
    return {
      resolveAccessibleOrganizationForCurrentUser,
    };
  }
);

import { switchApplicationScopeAction } from "./application-scope-actions";

describe("application-scope-actions", function describeApplicationScopeActions() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    vi.mocked(applyServerActionAuthCookies).mockResolvedValue(undefined);
    vi.mocked(clearActiveOrganizationSlugCookie).mockResolvedValue(undefined);
    vi.mocked(setActiveOrganizationSlugCookie).mockResolvedValue(undefined);
    vi.mocked(requireCurrentWritableUser).mockResolvedValue({
      ok: true,
      pb: {},
      user: {
        id: "user-1",
      },
    });
    vi.mocked(redirect).mockImplementation(function throwRedirect() {
      throw new Error("NEXT_REDIRECT");
    });
  });

  it("clears the active organization and redirects with replace for personal scope", async function testPersonalScopeSwitch() {
    await expect(
      switchApplicationScopeAction({
        scope: "personal",
        locale: "cs",
      })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(requireCurrentWritableUser).toHaveBeenCalledOnce();
    expect(clearActiveOrganizationSlugCookie).toHaveBeenCalledOnce();
    expect(setActiveOrganizationSlugCookie).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith(
      {
        href: APP_HOME_PATH,
        locale: "cs",
      },
      RedirectType.replace
    );
  });

  it("sets the active organization and redirects with replace for organization scope", async function testOrganizationScopeSwitch() {
    vi.mocked(resolveAccessibleOrganizationForCurrentUser).mockResolvedValue({
      ok: true,
      data: {
        organization: createUserOrganization({
          slug: "new-space",
        }),
      },
    });

    await expect(
      switchApplicationScopeAction({
        scope: "organization",
        organizationSlug: "new-space",
        locale: "en",
      })
    ).rejects.toThrow("NEXT_REDIRECT");

    expect(resolveAccessibleOrganizationForCurrentUser).toHaveBeenCalledWith("new-space");
    expect(setActiveOrganizationSlugCookie).toHaveBeenCalledWith("new-space");
    expect(clearActiveOrganizationSlugCookie).not.toHaveBeenCalled();
    expect(redirect).toHaveBeenCalledWith(
      {
        href: getOrganizationOverviewHref("new-space"),
        locale: "en",
      },
      RedirectType.replace
    );
  });

  it("rejects invalid input without mutating scope cookies", async function testInvalidInput() {
    const response = await switchApplicationScopeAction({
      scope: "organization",
      organizationSlug: "Invalid Slug",
      locale: "cs",
    } as SwitchApplicationScopeInput);

    expect(response).toEqual({
      ok: false,
      errorCode: "BAD_REQUEST",
    });
    expect(requireCurrentWritableUser).not.toHaveBeenCalled();
    expect(resolveAccessibleOrganizationForCurrentUser).not.toHaveBeenCalled();
    expect(clearActiveOrganizationSlugCookie).not.toHaveBeenCalled();
    expect(setActiveOrganizationSlugCookie).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });

  it("returns unauthorized without mutating scope cookies", async function testUnauthorizedScopeSwitch() {
    const cookieMutations = [{ name: "pb_auth", value: "", maxAge: 0 }];

    vi.mocked(resolveAccessibleOrganizationForCurrentUser).mockResolvedValue({
      ok: false,
      errorCode: "UNAUTHORIZED",
      cookieMutations,
    });

    const response = await switchApplicationScopeAction({
      scope: "organization",
      organizationSlug: "new-space",
      locale: "cs",
    });

    expect(response).toEqual({
      ok: false,
      errorCode: "UNAUTHORIZED",
    });
    expect(applyServerActionAuthCookies).toHaveBeenCalledWith(cookieMutations);
    expect(clearActiveOrganizationSlugCookie).not.toHaveBeenCalled();
    expect(setActiveOrganizationSlugCookie).not.toHaveBeenCalled();
    expect(redirect).not.toHaveBeenCalled();
  });
});

function createUserOrganization(input: { slug: string }) {
  return {
    id: "organization-1",
    name: "New Space",
    slug: input.slug,
    avatarUrl: null,
    membershipId: "membership-1",
    role: "owner" as const,
  };
}
