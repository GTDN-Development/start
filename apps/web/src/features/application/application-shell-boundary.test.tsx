import type PocketBase from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  getTranslationsMock,
  redirectMock,
  requireCurrentUserMock,
  getActiveWorkspaceSlugCookieMock,
  listUserWorkspacesWithClientMock,
  applicationRootMock,
} = vi.hoisted(function hoistApplicationShellBoundaryMocks() {
  return {
    getTranslationsMock: vi.fn(),
    redirectMock: vi.fn(),
    requireCurrentUserMock: vi.fn(),
    getActiveWorkspaceSlugCookieMock: vi.fn(),
    listUserWorkspacesWithClientMock: vi.fn(),
    applicationRootMock: vi.fn(),
  };
});

vi.mock("next-intl/server", function mockNextIntlServer() {
  return {
    getTranslations: getTranslationsMock,
  };
});

vi.mock("@/i18n/navigation", function mockNavigation() {
  return {
    redirect: redirectMock,
  };
});

vi.mock("@/server/auth/current-user", function mockCurrentUser() {
  return {
    requireCurrentUser: requireCurrentUserMock,
  };
});

vi.mock("@/server/workspaces/workspace-cookie", function mockWorkspaceCookie() {
  return {
    getActiveWorkspaceSlugCookie: getActiveWorkspaceSlugCookieMock,
  };
});

vi.mock("@/server/workspaces/workspace-resolution-service", function mockWorkspaceResolutionService() {
  return {
    listUserWorkspacesWithClient: listUserWorkspacesWithClientMock,
  };
});

vi.mock("./application-root", function mockApplicationRoot() {
  return {
    ApplicationRoot: applicationRootMock,
  };
});

import { APP_HOME_PATH, getWorkspaceOverviewHref } from "@/config/routes";
import { ApplicationShellBoundary } from "./application-shell-boundary";

describe("application-shell-boundary", function describeApplicationShellBoundary() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    getTranslationsMock.mockResolvedValue(() => "label");
    applicationRootMock.mockReturnValue(null);
  });

  it("uses the cookie slug when it exists in the loaded workspace list", async function testActiveWorkspaceFromList() {
    const pb = createPocketBaseMock();

    requireCurrentUserMock.mockResolvedValue({
      ok: true,
      pb,
      currentSessionIdHash: "session-1",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
      },
    });
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

    const result = await ApplicationShellBoundary({
      children: null,
      params: Promise.resolve({
        locale: "cs",
      }),
    });
    const props = getRenderedApplicationRootProps(result);

    expect(listUserWorkspacesWithClientMock).toHaveBeenCalledWith(pb, "user-1");
    expect(getActiveWorkspaceSlugCookieMock).toHaveBeenCalled();
    expect(props.activeWorkspaceSlug).toBe("team-space");
    expect(props.applicationEntryHref).toEqual(getWorkspaceOverviewHref("team-space"));
    expect(props.workspaces).toEqual([
      {
        id: "workspace-1",
        slug: "team-space",
        name: "Team Space",
        avatarUrl: null,
        role: "owner",
      },
    ]);
  });

  it("falls back to app home when the active cookie slug is stale", async function testStaleActiveWorkspaceCookie() {
    const pb = createPocketBaseMock();

    requireCurrentUserMock.mockResolvedValue({
      ok: true,
      pb,
      currentSessionIdHash: "session-1",
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
      },
    });
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

    const result = await ApplicationShellBoundary({
      children: null,
      params: Promise.resolve({
        locale: "cs",
      }),
    });
    const props = getRenderedApplicationRootProps(result);

    expect(props.activeWorkspaceSlug).toBeNull();
    expect(props.applicationEntryHref).toBe(APP_HOME_PATH);
    expect(redirectMock).not.toHaveBeenCalled();
  });
});

function createPocketBaseMock(): PocketBase {
  return {
    files: {
      getURL: vi.fn(),
    },
  } as unknown as PocketBase;
}

function getRenderedApplicationRootProps(result: unknown) {
  return (result as { props: Record<string, unknown> }).props;
}
