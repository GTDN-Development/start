import type PocketBase from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_HOME_PATH, getInviteHref, getWorkspaceOverviewHref } from "@/config/routes";
import {
  buildApplicationShellModel,
  clearSessionScopedApplicationState,
  resolveApplicationPostAuthState,
} from "./application-composition";

const {
  clearActiveWorkspaceSlugCookieMock,
  clearPendingInviteTokenCookieMock,
  getActiveWorkspaceSlugCookieMock,
  getPendingInviteTokenCookieMock,
  listUserWorkspacesWithClientMock,
  resolvePostAuthDestinationMock,
} = vi.hoisted(function hoistApplicationCompositionMocks() {
  return {
    clearActiveWorkspaceSlugCookieMock: vi.fn(),
    clearPendingInviteTokenCookieMock: vi.fn(),
    getActiveWorkspaceSlugCookieMock: vi.fn(),
    getPendingInviteTokenCookieMock: vi.fn(),
    listUserWorkspacesWithClientMock: vi.fn(),
    resolvePostAuthDestinationMock: vi.fn(),
  };
});

vi.mock("@/server/workspaces/workspace-cookie", function mockWorkspaceCookie() {
  return {
    clearActiveWorkspaceSlugCookie: clearActiveWorkspaceSlugCookieMock,
    clearPendingInviteTokenCookie: clearPendingInviteTokenCookieMock,
    getActiveWorkspaceSlugCookie: getActiveWorkspaceSlugCookieMock,
    getPendingInviteTokenCookie: getPendingInviteTokenCookieMock,
  };
});

vi.mock(
  "@/server/workspaces/workspace-resolution-service",
  function mockWorkspaceResolutionService() {
    return {
      listUserWorkspacesWithClient: listUserWorkspacesWithClientMock,
      resolvePostAuthDestination: resolvePostAuthDestinationMock,
    };
  }
);

describe("application-composition", function describeApplicationComposition() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("builds workspace navigation when the active workspace cookie matches a workspace", async function testBuildShellModelWithActiveWorkspace() {
    const pb = {} as PocketBase;

    listUserWorkspacesWithClientMock.mockResolvedValue({
      ok: true,
      data: {
        workspaces: [
          {
            id: "workspace-1",
            slug: "team-space",
            name: "Team Space",
            avatarUrl: null,
            membershipId: "membership-1",
            role: "owner",
          },
        ],
      },
    });
    getActiveWorkspaceSlugCookieMock.mockResolvedValue("team-space");

    const response = await buildApplicationShellModel({
      pb,
      user: {
        id: "user-1",
      } as never,
    });

    expect(response).toEqual({
      ok: true,
      data: {
        applicationEntryHref: getWorkspaceOverviewHref("team-space"),
        workspaceNavigation: {
          activeWorkspaceSlug: "team-space",
          workspaces: [
            {
              id: "workspace-1",
              slug: "team-space",
              name: "Team Space",
              avatarUrl: null,
              role: "owner",
            },
          ],
        },
      },
    });
  });

  it("falls back to app home for a stale workspace cookie", async function testBuildShellModelWithStaleWorkspace() {
    const pb = {} as PocketBase;

    listUserWorkspacesWithClientMock.mockResolvedValue({
      ok: true,
      data: {
        workspaces: [
          {
            id: "workspace-1",
            slug: "team-space",
            name: "Team Space",
            avatarUrl: null,
            membershipId: "membership-1",
            role: "owner",
          },
        ],
      },
    });
    getActiveWorkspaceSlugCookieMock.mockResolvedValue("stale-space");

    const response = await buildApplicationShellModel({
      pb,
      user: {
        id: "user-1",
      } as never,
    });

    expect(response).toEqual({
      ok: true,
      data: {
        applicationEntryHref: APP_HOME_PATH,
        workspaceNavigation: {
          activeWorkspaceSlug: null,
          workspaces: [
            {
              id: "workspace-1",
              slug: "team-space",
              name: "Team Space",
              avatarUrl: null,
              role: "owner",
            },
          ],
        },
      },
    });
  });

  it("returns a host-only shell model when the user has no workspaces", async function testBuildShellModelWithoutWorkspaces() {
    const pb = {} as PocketBase;

    listUserWorkspacesWithClientMock.mockResolvedValue({
      ok: true,
      data: {
        workspaces: [],
      },
    });

    const response = await buildApplicationShellModel({
      pb,
      user: {
        id: "user-1",
      } as never,
    });

    expect(response).toEqual({
      ok: true,
      data: {
        applicationEntryHref: APP_HOME_PATH,
        workspaceNavigation: null,
      },
    });
  });

  it("resolves invite redirects through the application composition seam", async function testResolveInvitePostAuthState() {
    getPendingInviteTokenCookieMock.mockResolvedValue("invite-1");
    resolvePostAuthDestinationMock.mockResolvedValue({
      ok: true,
      data: {
        state: "invite_redirect",
        inviteToken: "invite-1",
      },
    });

    const response = await resolveApplicationPostAuthState({
      userId: "user-1",
      userEmail: "user@example.com",
    });

    expect(resolvePostAuthDestinationMock).toHaveBeenCalledWith({
      userId: "user-1",
      userEmail: "user@example.com",
      pendingInviteToken: "invite-1",
    });
    expect(response).toEqual({
      ok: true,
      data: {
        href: getInviteHref("invite-1"),
        clearPendingInviteToken: true,
      },
    });
  });

  it("maps workspace redirects into application state", async function testResolveWorkspacePostAuthState() {
    getPendingInviteTokenCookieMock.mockResolvedValue(null);
    resolvePostAuthDestinationMock.mockResolvedValue({
      ok: true,
      data: {
        state: "workspace_redirect",
        workspaceSlug: "team-space",
      },
    });

    const response = await resolveApplicationPostAuthState({
      userId: "user-1",
      userEmail: "user@example.com",
    });

    expect(response).toEqual({
      ok: true,
      data: {
        href: getWorkspaceOverviewHref("team-space"),
        activeWorkspaceSlug: "team-space",
      },
    });
  });

  it("clears session-scoped application state through the host cleanup seam", async function testClearSessionScopedApplicationState() {
    await clearSessionScopedApplicationState();

    expect(clearActiveWorkspaceSlugCookieMock).toHaveBeenCalledTimes(1);
    expect(clearPendingInviteTokenCookieMock).toHaveBeenCalledTimes(1);
  });
});
