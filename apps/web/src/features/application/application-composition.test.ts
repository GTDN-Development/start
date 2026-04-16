import type PocketBase from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_HOME_PATH, getWorkspaceOverviewHref } from "@/config/routes";
import { buildApplicationShellModel } from "./application-composition";

const { getActiveWorkspaceSlugCookieMock, listUserWorkspacesWithClientMock } = vi.hoisted(
  function hoistApplicationCompositionMocks() {
    return {
      getActiveWorkspaceSlugCookieMock: vi.fn(),
      listUserWorkspacesWithClientMock: vi.fn(),
    };
  }
);

vi.mock("@/server/workspaces/workspace-cookie", function mockWorkspaceCookie() {
  return {
    getActiveWorkspaceSlugCookie: getActiveWorkspaceSlugCookieMock,
  };
});

vi.mock(
  "@/server/workspaces/workspace-resolution-service",
  function mockWorkspaceResolutionService() {
    return {
      listUserWorkspacesWithClient: listUserWorkspacesWithClientMock,
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
});
