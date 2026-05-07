import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  applyServerActionAuthCookies,
  clearActiveOrganizationSlugCookie,
  createOrganization,
  deleteOrganization,
  getActiveOrganizationSlugCookie,
  leaveOrganization,
  resolveAccessibleOrganizationForCurrentUser,
  setActiveOrganizationSlugCookie,
  updateOrganizationGeneral,
} = vi.hoisted(function hoistOrganizationGeneralActionMocks() {
  return {
    applyServerActionAuthCookies: vi.fn(),
    clearActiveOrganizationSlugCookie: vi.fn(),
    createOrganization: vi.fn(),
    deleteOrganization: vi.fn(),
    getActiveOrganizationSlugCookie: vi.fn(),
    leaveOrganization: vi.fn(),
    resolveAccessibleOrganizationForCurrentUser: vi.fn(),
    setActiveOrganizationSlugCookie: vi.fn(),
    updateOrganizationGeneral: vi.fn(),
  };
});

vi.mock("@/server/auth/auth-cookies", function mockAuthCookies() {
  return {
    applyServerActionAuthCookies,
  };
});

vi.mock("@/server/organizations/organization-cookie", function mockOrganizationCookie() {
  return {
    clearActiveOrganizationSlugCookie,
    getActiveOrganizationSlugCookie,
    setActiveOrganizationSlugCookie,
  };
});

vi.mock(
  "@/server/organizations/organization-general-mutations",
  function mockOrganizationMutations() {
    return {
      createOrganization,
      deleteOrganization,
      leaveOrganization,
      updateOrganizationGeneral,
    };
  }
);

vi.mock(
  "@/server/organizations/organization-route-queries",
  function mockOrganizationRouteQueries() {
    return {
      resolveAccessibleOrganizationForCurrentUser,
    };
  }
);

import {
  createOrganizationAction,
  deleteOrganizationAction,
  leaveOrganizationAction,
  switchOrganizationAction,
  updateOrganizationGeneralAction,
} from "./organization-general-actions";

describe("organization-general-actions", function describeOrganizationGeneralActions() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    vi.mocked(applyServerActionAuthCookies).mockResolvedValue(undefined);
  });

  it("returns the navigation patch and sets the active cookie on create", async function testCreateOrganization() {
    vi.mocked(createOrganization).mockResolvedValue({
      ok: true,
      data: {
        organization: createUserOrganization({
          slug: "new-space",
          name: "New Space",
        }),
      },
    });

    const response = await createOrganizationAction({
      name: "New Space",
      slug: "new-space",
    });

    expectOrganizationActionSuccess(response, {
      organizationSlug: "new-space",
      name: "New Space",
      activeOrganizationSlug: "new-space",
      redirectPathname: "/o/[organizationSlug]/overview",
    });
    expect(setActiveOrganizationSlugCookie).toHaveBeenCalledWith("new-space");
  });

  it("returns the navigation patch and sets the active cookie on switch", async function testSwitchOrganization() {
    vi.mocked(resolveAccessibleOrganizationForCurrentUser).mockResolvedValue({
      ok: true,
      data: {
        organization: createUserOrganization({
          slug: "new-space",
          name: "New Space",
        }),
      },
    });

    const response = await switchOrganizationAction("new-space");

    expect(response).toMatchObject({
      ok: true,
      data: {
        switched: true,
        organizationSlug: "new-space",
        navigationPatch: {
          activeOrganizationSlug: "new-space",
          redirectHref: {
            pathname: "/o/[organizationSlug]/overview",
            params: {
              organizationSlug: "new-space",
            },
          },
        },
      },
    });
    expect(setActiveOrganizationSlugCookie).toHaveBeenCalledWith("new-space");
  });

  it.each([
    {
      name: "updates the active cookie and redirects when renaming the current organization",
      activeOrganizationSlug: "team-space",
      input: {
        slug: "renamed-space",
      },
      serviceResponse: createUpdateOrganizationResponse({
        previousSlug: "team-space",
        nextSlug: "renamed-space",
      }),
      expectedOrganization: {
        organizationSlug: "renamed-space",
        name: "Team Space",
        avatarUrl: null,
        activeOrganizationSlug: "renamed-space",
        redirectPathname: "/o/[organizationSlug]/settings",
      },
      shouldSetActiveCookie: true,
    },
    {
      name: "only upserts navigation for metadata-only updates",
      activeOrganizationSlug: "active-space",
      input: {
        name: "Updated Team Space",
      },
      serviceResponse: createUpdateOrganizationResponse({
        previousSlug: "team-space",
        nextSlug: "team-space",
        name: "Updated Team Space",
        avatarUrl: "https://example.com/avatar.png",
      }),
      expectedOrganization: {
        organizationSlug: "team-space",
        name: "Updated Team Space",
        avatarUrl: "https://example.com/avatar.png",
      },
      shouldSetActiveCookie: false,
    },
  ])("$name", async function testOrganizationUpdate(input) {
    vi.mocked(getActiveOrganizationSlugCookie).mockResolvedValue(input.activeOrganizationSlug);
    vi.mocked(updateOrganizationGeneral).mockResolvedValue(input.serviceResponse);

    const response = await updateOrganizationGeneralAction("team-space", input.input);

    expectOrganizationActionSuccess(response, input.expectedOrganization);
    expect(setActiveOrganizationSlugCookie).toHaveBeenCalledTimes(
      input.shouldSetActiveCookie ? 1 : 0
    );
    if (input.shouldSetActiveCookie) {
      expect(setActiveOrganizationSlugCookie).toHaveBeenCalledWith(
        input.expectedOrganization.organizationSlug
      );
    }
  });

  it.each([
    {
      name: "leave",
      action: leaveOrganizationAction,
      resolveSuccess: function resolveSuccess() {
        vi.mocked(leaveOrganization).mockResolvedValue({
          ok: true,
          data: {
            left: true,
            organizationId: "organization-1",
          },
        });
      },
    },
    {
      name: "delete",
      action: deleteOrganizationAction,
      resolveSuccess: function resolveSuccess() {
        vi.mocked(deleteOrganization).mockResolvedValue({
          ok: true,
          data: {
            deleted: true,
            organizationId: "organization-1",
          },
        });
      },
    },
  ])(
    "clears the active cookie after successful $name only for the active organization",
    async function testOrganizationRemovalCookieCleanup(input) {
      for (const activeOrganizationSlug of ["team-space", "other-space", null] as const) {
        vi.clearAllMocks();
        vi.mocked(applyServerActionAuthCookies).mockResolvedValue(undefined);
        input.resolveSuccess();
        vi.mocked(getActiveOrganizationSlugCookie).mockResolvedValue(activeOrganizationSlug);

        const response = await input.action("team-space");
        const expectedNavigationPatch = {
          removeOrganizationId: "organization-1",
          ...(activeOrganizationSlug === "team-space" ? { activeOrganizationSlug: null } : {}),
          redirectHref: "/app",
        };

        expect(response).toMatchObject({
          ok: true,
          data: {
            navigationPatch: expectedNavigationPatch,
          },
        });
        if (activeOrganizationSlug !== "team-space" && response.ok) {
          expect(response.data.navigationPatch).not.toHaveProperty("activeOrganizationSlug");
        }
        expect(clearActiveOrganizationSlugCookie).toHaveBeenCalledTimes(
          activeOrganizationSlug === "team-space" ? 1 : 0
        );
      }
    }
  );

  it.each([
    {
      name: "leave",
      action: leaveOrganizationAction,
      resolveFailure: function resolveFailure() {
        vi.mocked(leaveOrganization).mockResolvedValue({
          ok: false,
          errorCode: "FORBIDDEN",
        });
      },
    },
    {
      name: "delete",
      action: deleteOrganizationAction,
      resolveFailure: function resolveFailure() {
        vi.mocked(deleteOrganization).mockResolvedValue({
          ok: false,
          errorCode: "FORBIDDEN",
        });
      },
    },
  ])(
    "does not read or clear the active cookie when $name fails",
    async function testOrganizationRemovalFailure(input) {
      input.resolveFailure();

      const response = await input.action("team-space");

      expect(response).toEqual({
        ok: false,
        errorCode: "FORBIDDEN",
      });
      expect(getActiveOrganizationSlugCookie).not.toHaveBeenCalled();
      expect(clearActiveOrganizationSlugCookie).not.toHaveBeenCalled();
    }
  );
});

function createUpdateOrganizationResponse(input: {
  previousSlug: string;
  nextSlug: string;
  name?: string;
  avatarUrl?: string | null;
}) {
  return {
    ok: true as const,
    data: {
      previousSlug: input.previousSlug,
      organization: createUserOrganization({
        slug: input.nextSlug,
        name: input.name ?? "Team Space",
        avatarUrl: input.avatarUrl ?? null,
      }),
    },
  };
}

function createUserOrganization(input: { slug: string; name?: string; avatarUrl?: string | null }) {
  return {
    id: "organization-1",
    name: input.name ?? "Team Space",
    slug: input.slug,
    avatarUrl: input.avatarUrl ?? null,
    membershipId: "membership-1",
    role: "owner" as const,
  };
}

function expectOrganizationActionSuccess(
  response: unknown,
  expectedOrganization: {
    organizationSlug: string;
    name: string;
    avatarUrl?: string | null;
    activeOrganizationSlug?: string;
    redirectPathname?: string;
  }
) {
  const organization = {
    id: "organization-1",
    slug: expectedOrganization.organizationSlug,
    name: expectedOrganization.name,
    role: "owner",
    avatarUrl: expectedOrganization.avatarUrl ?? null,
  };

  expect(response).toEqual({
    ok: true,
    data: {
      organizationSlug: expectedOrganization.organizationSlug,
      organization,
      navigationPatch: {
        upsertOrganization: organization,
        ...(expectedOrganization.activeOrganizationSlug
          ? { activeOrganizationSlug: expectedOrganization.activeOrganizationSlug }
          : {}),
        ...(expectedOrganization.redirectPathname
          ? {
              redirectHref: {
                pathname: expectedOrganization.redirectPathname,
                params: {
                  organizationSlug: expectedOrganization.organizationSlug,
                },
              },
            }
          : {}),
      },
    },
  });
}
