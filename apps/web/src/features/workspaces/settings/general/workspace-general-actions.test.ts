import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  applyServerActionAuthCookies,
  clearActiveWorkspaceSlugCookie,
  createWorkspace,
  deleteWorkspace,
  getActiveWorkspaceSlugCookie,
  leaveWorkspace,
  resolveAccessibleWorkspaceForCurrentUser,
  setActiveWorkspaceSlugCookie,
  updateWorkspaceGeneral,
} = vi.hoisted(function hoistWorkspaceGeneralActionMocks() {
  return {
    applyServerActionAuthCookies: vi.fn(),
    clearActiveWorkspaceSlugCookie: vi.fn(),
    createWorkspace: vi.fn(),
    deleteWorkspace: vi.fn(),
    getActiveWorkspaceSlugCookie: vi.fn(),
    leaveWorkspace: vi.fn(),
    resolveAccessibleWorkspaceForCurrentUser: vi.fn(),
    setActiveWorkspaceSlugCookie: vi.fn(),
    updateWorkspaceGeneral: vi.fn(),
  };
});

vi.mock("@/server/auth/auth-cookies", function mockAuthCookies() {
  return {
    applyServerActionAuthCookies,
  };
});

vi.mock("@/server/workspaces/workspace-cookie", function mockWorkspaceCookie() {
  return {
    clearActiveWorkspaceSlugCookie,
    getActiveWorkspaceSlugCookie,
    setActiveWorkspaceSlugCookie,
  };
});

vi.mock("@/server/workspaces/workspace-general-mutations", function mockWorkspaceMutations() {
  return {
    createWorkspace,
    deleteWorkspace,
    leaveWorkspace,
    updateWorkspaceGeneral,
  };
});

vi.mock("@/server/workspaces/workspace-route-queries", function mockWorkspaceRouteQueries() {
  return {
    resolveAccessibleWorkspaceForCurrentUser,
  };
});

import {
  createWorkspaceAction,
  deleteWorkspaceAction,
  leaveWorkspaceAction,
  switchWorkspaceAction,
  updateWorkspaceGeneralAction,
} from "./workspace-general-actions";

describe("workspace-general-actions", function describeWorkspaceGeneralActions() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    vi.mocked(applyServerActionAuthCookies).mockResolvedValue(undefined);
  });

  it("returns the navigation patch and sets the active cookie on create", async function testCreateWorkspace() {
    vi.mocked(createWorkspace).mockResolvedValue({
      ok: true,
      data: {
        workspace: createUserWorkspace({
          slug: "new-space",
          name: "New Space",
        }),
      },
    });

    const response = await createWorkspaceAction({
      name: "New Space",
      slug: "new-space",
    });

    expectWorkspaceActionSuccess(response, {
      workspaceSlug: "new-space",
      name: "New Space",
      activeWorkspaceSlug: "new-space",
      redirectPathname: "/w/[workspaceSlug]/overview",
    });
    expect(setActiveWorkspaceSlugCookie).toHaveBeenCalledWith("new-space");
  });

  it("returns the navigation patch and sets the active cookie on switch", async function testSwitchWorkspace() {
    vi.mocked(resolveAccessibleWorkspaceForCurrentUser).mockResolvedValue({
      ok: true,
      data: {
        workspace: createUserWorkspace({
          slug: "new-space",
          name: "New Space",
        }),
      },
    });

    const response = await switchWorkspaceAction("new-space");

    expect(response).toMatchObject({
      ok: true,
      data: {
        switched: true,
        workspaceSlug: "new-space",
        navigationPatch: {
          activeWorkspaceSlug: "new-space",
          redirectHref: {
            pathname: "/w/[workspaceSlug]/overview",
            params: {
              workspaceSlug: "new-space",
            },
          },
        },
      },
    });
    expect(setActiveWorkspaceSlugCookie).toHaveBeenCalledWith("new-space");
  });

  it.each([
    {
      name: "updates the active cookie and redirects when renaming the current workspace",
      activeWorkspaceSlug: "team-space",
      input: {
        slug: "renamed-space",
      },
      serviceResponse: createUpdateWorkspaceResponse({
        previousSlug: "team-space",
        nextSlug: "renamed-space",
      }),
      expectedWorkspace: {
        workspaceSlug: "renamed-space",
        name: "Team Space",
        avatarUrl: null,
        activeWorkspaceSlug: "renamed-space",
        redirectPathname: "/w/[workspaceSlug]/settings",
      },
      shouldSetActiveCookie: true,
    },
    {
      name: "only upserts navigation for metadata-only updates",
      activeWorkspaceSlug: "active-space",
      input: {
        name: "Updated Team Space",
      },
      serviceResponse: createUpdateWorkspaceResponse({
        previousSlug: "team-space",
        nextSlug: "team-space",
        name: "Updated Team Space",
        avatarUrl: "https://example.com/avatar.png",
      }),
      expectedWorkspace: {
        workspaceSlug: "team-space",
        name: "Updated Team Space",
        avatarUrl: "https://example.com/avatar.png",
      },
      shouldSetActiveCookie: false,
    },
  ])("$name", async function testWorkspaceUpdate(input) {
    vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue(input.activeWorkspaceSlug);
    vi.mocked(updateWorkspaceGeneral).mockResolvedValue(input.serviceResponse);

    const response = await updateWorkspaceGeneralAction("team-space", input.input);

    expectWorkspaceActionSuccess(response, input.expectedWorkspace);
    expect(setActiveWorkspaceSlugCookie).toHaveBeenCalledTimes(input.shouldSetActiveCookie ? 1 : 0);
    if (input.shouldSetActiveCookie) {
      expect(setActiveWorkspaceSlugCookie).toHaveBeenCalledWith(
        input.expectedWorkspace.workspaceSlug
      );
    }
  });

  it.each([
    {
      name: "leave",
      action: leaveWorkspaceAction,
      resolveSuccess: function resolveSuccess() {
        vi.mocked(leaveWorkspace).mockResolvedValue({
          ok: true,
          data: {
            left: true,
            workspaceId: "workspace-1",
          },
        });
      },
    },
    {
      name: "delete",
      action: deleteWorkspaceAction,
      resolveSuccess: function resolveSuccess() {
        vi.mocked(deleteWorkspace).mockResolvedValue({
          ok: true,
          data: {
            deleted: true,
            workspaceId: "workspace-1",
          },
        });
      },
    },
  ])(
    "clears the active cookie after successful $name only for the active workspace",
    async function testWorkspaceRemovalCookieCleanup(input) {
      for (const activeWorkspaceSlug of ["team-space", "other-space", null] as const) {
        vi.clearAllMocks();
        vi.mocked(applyServerActionAuthCookies).mockResolvedValue(undefined);
        input.resolveSuccess();
        vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue(activeWorkspaceSlug);

        const response = await input.action("team-space");
        const expectedNavigationPatch = {
          removeWorkspaceId: "workspace-1",
          ...(activeWorkspaceSlug === "team-space" ? { activeWorkspaceSlug: null } : {}),
          redirectHref: "/app",
        };

        expect(response).toMatchObject({
          ok: true,
          data: {
            navigationPatch: expectedNavigationPatch,
          },
        });
        if (activeWorkspaceSlug !== "team-space" && response.ok) {
          expect(response.data.navigationPatch).not.toHaveProperty("activeWorkspaceSlug");
        }
        expect(clearActiveWorkspaceSlugCookie).toHaveBeenCalledTimes(
          activeWorkspaceSlug === "team-space" ? 1 : 0
        );
      }
    }
  );

  it.each([
    {
      name: "leave",
      action: leaveWorkspaceAction,
      resolveFailure: function resolveFailure() {
        vi.mocked(leaveWorkspace).mockResolvedValue({
          ok: false,
          errorCode: "FORBIDDEN",
        });
      },
    },
    {
      name: "delete",
      action: deleteWorkspaceAction,
      resolveFailure: function resolveFailure() {
        vi.mocked(deleteWorkspace).mockResolvedValue({
          ok: false,
          errorCode: "FORBIDDEN",
        });
      },
    },
  ])(
    "does not read or clear the active cookie when $name fails",
    async function testWorkspaceRemovalFailure(input) {
      input.resolveFailure();

      const response = await input.action("team-space");

      expect(response).toEqual({
        ok: false,
        errorCode: "FORBIDDEN",
      });
      expect(getActiveWorkspaceSlugCookie).not.toHaveBeenCalled();
      expect(clearActiveWorkspaceSlugCookie).not.toHaveBeenCalled();
    }
  );
});

function createUpdateWorkspaceResponse(input: {
  previousSlug: string;
  nextSlug: string;
  name?: string;
  avatarUrl?: string | null;
}) {
  return {
    ok: true as const,
    data: {
      previousSlug: input.previousSlug,
      workspace: createUserWorkspace({
        slug: input.nextSlug,
        name: input.name ?? "Team Space",
        avatarUrl: input.avatarUrl ?? null,
      }),
    },
  };
}

function createUserWorkspace(input: { slug: string; name?: string; avatarUrl?: string | null }) {
  return {
    id: "workspace-1",
    name: input.name ?? "Team Space",
    slug: input.slug,
    avatarUrl: input.avatarUrl ?? null,
    membershipId: "membership-1",
    role: "owner" as const,
  };
}

function expectWorkspaceActionSuccess(
  response: unknown,
  expectedWorkspace: {
    workspaceSlug: string;
    name: string;
    avatarUrl?: string | null;
    activeWorkspaceSlug?: string;
    redirectPathname?: string;
  }
) {
  const workspace = {
    id: "workspace-1",
    slug: expectedWorkspace.workspaceSlug,
    name: expectedWorkspace.name,
    role: "owner",
    avatarUrl: expectedWorkspace.avatarUrl ?? null,
  };

  expect(response).toEqual({
    ok: true,
    data: {
      workspaceSlug: expectedWorkspace.workspaceSlug,
      workspace,
      navigationPatch: {
        upsertWorkspace: workspace,
        ...(expectedWorkspace.activeWorkspaceSlug
          ? { activeWorkspaceSlug: expectedWorkspace.activeWorkspaceSlug }
          : {}),
        ...(expectedWorkspace.redirectPathname
          ? {
              redirectHref: {
                pathname: expectedWorkspace.redirectPathname,
                params: {
                  workspaceSlug: expectedWorkspace.workspaceSlug,
                },
              },
            }
          : {}),
      },
    },
  });
}
