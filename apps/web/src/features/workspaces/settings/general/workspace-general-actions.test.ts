import { revalidatePath } from "next/cache";
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

vi.mock("next/cache", function mockNextCache() {
  return {
    revalidatePath: vi.fn(),
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
  deleteWorkspaceAction,
  leaveWorkspaceAction,
  updateWorkspaceGeneralAction,
} from "./workspace-general-actions";

describe("workspace-general-actions", function describeWorkspaceGeneralActions() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    vi.mocked(applyServerActionAuthCookies).mockResolvedValue(undefined);
  });

  it("updates the active workspace cookie when the active workspace slug changes", async function testActiveWorkspaceSlugRename() {
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
        workspace: expect.objectContaining({
          id: "workspace-1",
          slug: "renamed-space",
        }),
      },
    });
    expect(setActiveWorkspaceSlugCookie).toHaveBeenCalledWith("renamed-space");
    expect(revalidatePath).toHaveBeenNthCalledWith(1, "/w/team-space/settings");
    expect(revalidatePath).toHaveBeenNthCalledWith(2, "/w/team-space/overview");
    expect(revalidatePath).toHaveBeenNthCalledWith(3, "/w/renamed-space/settings");
    expect(revalidatePath).toHaveBeenNthCalledWith(4, "/w/renamed-space/overview");
    expect(applyServerActionAuthCookies).toHaveBeenCalledWith(undefined);
  });

  it("does not update the active workspace cookie when renaming a different workspace", async function testInactiveWorkspaceSlugRename() {
    vi.mocked(getActiveWorkspaceSlugCookie).mockResolvedValue("active-space");
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
        workspace: expect.objectContaining({
          id: "workspace-1",
          slug: "renamed-space",
        }),
      },
    });
    expect(setActiveWorkspaceSlugCookie).not.toHaveBeenCalled();
    expect(revalidatePath).toHaveBeenCalledTimes(4);
  });

  it("does not update the active workspace cookie when only workspace metadata changes", async function testMetadataUpdateDoesNotSwitchActiveWorkspace() {
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
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("creates an active workspace cookie when renaming the current workspace without an existing cookie", async function testMissingActiveWorkspaceCookie() {
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
        workspace: expect.objectContaining({
          id: "workspace-1",
          slug: "renamed-space",
        }),
      },
    });
    expect(setActiveWorkspaceSlugCookie).toHaveBeenCalledWith("renamed-space");
    expect(revalidatePath).toHaveBeenCalledTimes(4);
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
      expect(revalidatePath).toHaveBeenCalledWith("/app");
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
        expect(revalidatePath).toHaveBeenCalledWith("/app");
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
      expect(revalidatePath).not.toHaveBeenCalled();
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
      workspace: {
        id: "workspace-1",
        name: input.name ?? "Team Space",
        slug: input.nextSlug,
        avatarUrl: input.avatarUrl ?? null,
        membershipId: "membership-1",
        role: "owner" as const,
      },
    },
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
