import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  applyServerActionAuthCookies,
  clearActiveWorkspaceSlugCookie,
  createWorkspaceForCurrentUser,
  deleteWorkspaceForCurrentUser,
  getActiveWorkspaceSlugCookie,
  leaveWorkspaceForCurrentUser,
  resolveAccessibleWorkspaceForCurrentUser,
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
    resolveAccessibleWorkspaceForCurrentUser: vi.fn(),
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
      resolveAccessibleWorkspaceForCurrentUser,
    };
  }
);

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

  it("returns the mapped workspace item and sets the active cookie on create", async function testCreateWorkspace() {
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

    expect(response).toEqual({
      ok: true,
      data: {
        workspaceSlug: "new-space",
        workspace: {
          id: "workspace-1",
          slug: "new-space",
          name: "New Space",
          role: "owner",
          avatarUrl: null,
        },
      },
    });
    expect(setActiveWorkspaceSlugCookie).toHaveBeenCalledWith("new-space");
    expect(applyServerActionAuthCookies).toHaveBeenCalledWith(undefined);
  });

  it("updates the active workspace cookie when the current workspace slug changes", async function testActiveWorkspaceSlugRename() {
    vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue("team-space");
    vi.mocked(updateWorkspaceGeneralForCurrentUser).mockResolvedValue(
      createUpdateWorkspaceResponse({
        previousSlug: "team-space",
        nextSlug: "renamed-space",
      })
    );

    const response = await updateWorkspaceGeneralAction("team-space", {
      slug: "renamed-space",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        workspaceSlug: "renamed-space",
        workspace: {
          id: "workspace-1",
          slug: "renamed-space",
          name: "Team Space",
          role: "owner",
          avatarUrl: null,
        },
      },
    });
    expect(setActiveWorkspaceSlugCookie).toHaveBeenCalledWith("renamed-space");
    expect(applyServerActionAuthCookies).toHaveBeenCalledWith(undefined);
  });

  it("does not touch the active workspace cookie when only metadata changes", async function testMetadataUpdateDoesNotSwitchActiveWorkspace() {
    vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue("active-space");
    vi.mocked(updateWorkspaceGeneralForCurrentUser).mockResolvedValue(
      createUpdateWorkspaceResponse({
        previousSlug: "team-space",
        nextSlug: "team-space",
        name: "Updated Team Space",
        avatarUrl: "https://example.com/avatar.png",
      })
    );

    const response = await updateWorkspaceGeneralAction("team-space", {
      name: "Updated Team Space",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        workspaceSlug: "team-space",
        workspace: {
          id: "workspace-1",
          slug: "team-space",
          name: "Updated Team Space",
          role: "owner",
          avatarUrl: "https://example.com/avatar.png",
        },
      },
    });
    expect(setActiveWorkspaceSlugCookie).not.toHaveBeenCalled();
  });

  it("creates an active workspace cookie when renaming the current route without an existing cookie", async function testMissingActiveWorkspaceCookie() {
    vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue(null);
    vi.mocked(updateWorkspaceGeneralForCurrentUser).mockResolvedValue(
      createUpdateWorkspaceResponse({
        previousSlug: "team-space",
        nextSlug: "renamed-space",
      })
    );

    const response = await updateWorkspaceGeneralAction("team-space", {
      slug: "renamed-space",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        workspaceSlug: "renamed-space",
        workspace: {
          id: "workspace-1",
          slug: "renamed-space",
          name: "Team Space",
          role: "owner",
          avatarUrl: null,
        },
      },
    });
    expect(setActiveWorkspaceSlugCookie).toHaveBeenCalledWith("renamed-space");
  });

  it("sets the active cookie when switching workspaces", async function testSwitchWorkspace() {
    vi.mocked(resolveAccessibleWorkspaceForCurrentUser).mockResolvedValue({
      ok: true,
      data: {
        pb: null,
        user: null,
        workspace: createUserWorkspace({
          slug: "team-space",
        }),
      },
    });

    const response = await switchWorkspaceAction("team-space");

    expect(response).toEqual({
      ok: true,
      data: {
        switched: true,
        workspaceSlug: "team-space",
      },
    });
    expect(setActiveWorkspaceSlugCookie).toHaveBeenCalledWith("team-space");
  });

  it.each([
    {
      name: "leave",
      action: leaveWorkspaceAction,
      resolveSuccess: function resolveSuccess() {
        vi.mocked(leaveWorkspaceForCurrentUser).mockResolvedValue(createLeaveWorkspaceResponse());
      },
      resolveFailure: function resolveFailure() {
        vi.mocked(leaveWorkspaceForCurrentUser).mockResolvedValue({
          ok: false,
          errorCode: "FORBIDDEN",
        });
      },
      successResponse: {
        ok: true as const,
        data: {
          left: true as const,
        },
      },
    },
    {
      name: "delete",
      action: deleteWorkspaceAction,
      resolveSuccess: function resolveSuccess() {
        vi.mocked(deleteWorkspaceForCurrentUser).mockResolvedValue(createDeleteWorkspaceResponse());
      },
      resolveFailure: function resolveFailure() {
        vi.mocked(deleteWorkspaceForCurrentUser).mockResolvedValue({
          ok: false,
          errorCode: "FORBIDDEN",
        });
      },
      successResponse: {
        ok: true as const,
        data: {
          deleted: true as const,
        },
      },
    },
  ])(
    "clears the active workspace cookie after successful $name when the slug matches",
    async function testActiveWorkspaceCleanupOnMatch(input) {
      input.resolveSuccess();
      vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue("team-space");

      const response = await input.action("team-space");

      expect(response).toEqual(input.successResponse);
      expect(getActiveWorkspaceSlugCookie).toHaveBeenCalledTimes(1);
      expect(clearActiveWorkspaceSlugCookie).toHaveBeenCalledTimes(1);
    }
  );

  it.each([
    {
      name: "leave",
      action: leaveWorkspaceAction,
      resolveSuccess: function resolveSuccess() {
        vi.mocked(leaveWorkspaceForCurrentUser).mockResolvedValue(createLeaveWorkspaceResponse());
      },
      successResponse: {
        ok: true as const,
        data: {
          left: true as const,
        },
      },
    },
    {
      name: "delete",
      action: deleteWorkspaceAction,
      resolveSuccess: function resolveSuccess() {
        vi.mocked(deleteWorkspaceForCurrentUser).mockResolvedValue(createDeleteWorkspaceResponse());
      },
      successResponse: {
        ok: true as const,
        data: {
          deleted: true as const,
        },
      },
    },
  ])(
    "does not clear the active workspace cookie after successful $name when the slug does not match or is missing",
    async function testActiveWorkspaceCleanupSkip(input) {
      input.resolveSuccess();

      for (const activeWorkspaceSlug of ["active-space", null] as const) {
        vi.clearAllMocks();
        vi.mocked(applyServerActionAuthCookies).mockResolvedValue(undefined);
        input.resolveSuccess();
        vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue(activeWorkspaceSlug);

        const response = await input.action("team-space");

        expect(response).toEqual(input.successResponse);
        expect(getActiveWorkspaceSlugCookie).toHaveBeenCalledTimes(1);
        expect(clearActiveWorkspaceSlugCookie).not.toHaveBeenCalled();
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
    "does not read or clear the active workspace cookie when $name fails",
    async function testActiveWorkspaceCleanupFailure(input) {
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

function createLeaveWorkspaceResponse() {
  return {
    ok: true as const,
    data: {
      left: true as const,
    },
  };
}

function createDeleteWorkspaceResponse() {
  return {
    ok: true as const,
    data: {
      deleted: true as const,
    },
  };
}
