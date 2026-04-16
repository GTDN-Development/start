import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  applyServerActionAuthCookies,
  clearActiveWorkspaceSlugCookie,
  createWorkspaceForCurrentUser,
  deleteWorkspaceForCurrentUser,
  getActiveWorkspaceSlugCookie,
  leaveWorkspaceForCurrentUser,
  setActiveWorkspaceSlugCookie,
  updateWorkspaceGeneralForCurrentUser,
} = vi.hoisted(function hoistWorkspaceGeneralActionMocks() {
  return {
    applyServerActionAuthCookies: vi.fn(),
    clearActiveWorkspaceSlugCookie: vi.fn(),
    createWorkspaceForCurrentUser: vi.fn(),
    deleteWorkspaceForCurrentUser: vi.fn(),
    getActiveWorkspaceSlugCookie: vi.fn(),
    leaveWorkspaceForCurrentUser: vi.fn(),
    setActiveWorkspaceSlugCookie: vi.fn(),
    updateWorkspaceGeneralForCurrentUser: vi.fn(),
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

vi.mock("@/server/workspaces/workspace-general-service", function mockWorkspaceGeneralService() {
  return {
    createWorkspaceForCurrentUser,
    deleteWorkspaceForCurrentUser,
    updateWorkspaceGeneralForCurrentUser,
  };
});

vi.mock("@/server/workspaces/workspace-members-service", function mockWorkspaceMembersService() {
  return {
    leaveWorkspaceForCurrentUser,
  };
});

vi.mock(
  "@/server/workspaces/workspace-resolution-service",
  function mockWorkspaceResolutionService() {
    return {
      resolveAccessibleWorkspaceForCurrentUser: vi.fn(),
    };
  }
);

import {
  createWorkspaceAction,
  deleteWorkspaceAction,
  leaveWorkspaceAction,
  updateWorkspaceGeneralAction,
} from "./workspace-general-actions";

describe("workspace-general-actions", function describeWorkspaceGeneralActions() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    vi.mocked(applyServerActionAuthCookies).mockResolvedValue(undefined);
  });

  it("returns the mapped workspace payload and sets the active cookie on create", async function testCreateWorkspace() {
    vi.mocked(createWorkspaceForCurrentUser).mockResolvedValue({
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
    });
    expect(setActiveWorkspaceSlugCookie).toHaveBeenCalledWith("new-space");
  });

  it.each([
    {
      name: "updates the active cookie when renaming the current workspace",
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
      },
      shouldSetActiveCookie: true,
    },
    {
      name: "does not touch the active cookie for metadata-only updates",
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
    vi.mocked(updateWorkspaceGeneralForCurrentUser).mockResolvedValue(input.serviceResponse);

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
        vi.mocked(leaveWorkspaceForCurrentUser).mockResolvedValue({
          ok: true,
          data: {
            left: true,
          },
        });
      },
      resolveFailure: function resolveFailure() {
        vi.mocked(leaveWorkspaceForCurrentUser).mockResolvedValue({
          ok: false,
          errorCode: "FORBIDDEN",
        });
      },
    },
    {
      name: "delete",
      action: deleteWorkspaceAction,
      resolveSuccess: function resolveSuccess() {
        vi.mocked(deleteWorkspaceForCurrentUser).mockResolvedValue({
          ok: true,
          data: {
            deleted: true,
          },
        });
      },
      resolveFailure: function resolveFailure() {
        vi.mocked(deleteWorkspaceForCurrentUser).mockResolvedValue({
          ok: false,
          errorCode: "FORBIDDEN",
        });
      },
    },
  ])(
    "clears the active cookie after successful $name only for the active workspace",
    async function testWorkspaceRemovalCookieCleanup(input) {
      input.resolveSuccess();

      for (const activeWorkspaceSlug of ["team-space", "other-space", null] as const) {
        vi.clearAllMocks();
        vi.mocked(applyServerActionAuthCookies).mockResolvedValue(undefined);
        input.resolveSuccess();
        vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue(activeWorkspaceSlug);

        await input.action("team-space");

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
        vi.mocked(leaveWorkspaceForCurrentUser).mockResolvedValue({
          ok: false,
          errorCode: "FORBIDDEN",
        });
      },
    },
    {
      name: "delete",
      action: deleteWorkspaceAction,
      resolveFailure: function resolveFailure() {
        vi.mocked(deleteWorkspaceForCurrentUser).mockResolvedValue({
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
  }
) {
  expect(response).toEqual({
    ok: true,
    data: {
      workspaceSlug: expectedWorkspace.workspaceSlug,
      workspace: {
        id: "workspace-1",
        slug: expectedWorkspace.workspaceSlug,
        name: expectedWorkspace.name,
        role: "owner",
        avatarUrl: expectedWorkspace.avatarUrl ?? null,
      },
    },
  });
}
