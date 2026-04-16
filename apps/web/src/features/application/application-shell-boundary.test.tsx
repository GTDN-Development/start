import type PocketBase from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_HOME_PATH, getWorkspaceOverviewHref } from "@/config/routes";
import { ApplicationShellBoundary } from "./application-shell-boundary";

const {
  getTranslationsMock,
  redirectMock,
  requireCurrentUserMock,
  buildApplicationShellModelMock,
  applicationRootMock,
  applicationWorkspaceRootMock,
} = vi.hoisted(function hoistApplicationShellBoundaryMocks() {
  return {
    getTranslationsMock: vi.fn(),
    redirectMock: vi.fn(),
    requireCurrentUserMock: vi.fn(),
    buildApplicationShellModelMock: vi.fn(),
    applicationRootMock: vi.fn(),
    applicationWorkspaceRootMock: vi.fn(),
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

vi.mock("./application-composition", function mockApplicationComposition() {
  return {
    buildApplicationShellModel: buildApplicationShellModelMock,
  };
});

vi.mock("./application-root", function mockApplicationRoot() {
  return {
    ApplicationRoot: applicationRootMock,
  };
});

vi.mock("./application-workspace-root", function mockApplicationWorkspaceRoot() {
  return {
    ApplicationWorkspaceRoot: applicationWorkspaceRootMock,
  };
});

describe("application-shell-boundary", function describeApplicationShellBoundary() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    getTranslationsMock.mockResolvedValue(() => "label");
  });

  it("wraps the host root with workspace navigation when the shell model includes workspaces", async function testWorkspaceShell() {
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
    buildApplicationShellModelMock.mockResolvedValue({
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

    const result = await ApplicationShellBoundary({
      children: null,
      params: Promise.resolve({
        locale: "cs",
      }),
    });
    const workspaceRoot = getRenderedElement(result);
    const root = getRenderedElement(workspaceRoot.props.children);

    expect(buildApplicationShellModelMock).toHaveBeenCalledWith({
      pb,
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
      },
    });
    expect(workspaceRoot.type).toBe(applicationWorkspaceRootMock);
    expect(workspaceRoot.props.activeWorkspaceSlug).toBe("team-space");
    expect(workspaceRoot.props.workspaces).toEqual([
      {
        id: "workspace-1",
        slug: "team-space",
        name: "Team Space",
        avatarUrl: null,
        role: "owner",
      },
    ]);
    expect(root.type).toBe(applicationRootMock);
    expect(root.props.applicationEntryHref).toEqual(getWorkspaceOverviewHref("team-space"));
  });

  it("wraps the host root with an empty workspace snapshot when the shell model omits navigation", async function testHostOnlyShell() {
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
    buildApplicationShellModelMock.mockResolvedValue({
      ok: true,
      data: {
        applicationEntryHref: APP_HOME_PATH,
        workspaceNavigation: null,
      },
    });

    const result = await ApplicationShellBoundary({
      children: null,
      params: Promise.resolve({
        locale: "cs",
      }),
    });
    const workspaceRoot = getRenderedElement(result);
    const root = getRenderedElement(workspaceRoot.props.children);

    expect(workspaceRoot.type).toBe(applicationWorkspaceRootMock);
    expect(workspaceRoot.props.activeWorkspaceSlug).toBeNull();
    expect(workspaceRoot.props.workspaces).toEqual([]);
    expect(root.type).toBe(applicationRootMock);
    expect(root.props.applicationEntryHref).toBe(APP_HOME_PATH);
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

function getRenderedElement(result: unknown) {
  return result as {
    type: unknown;
    props: Record<string, unknown>;
  };
}
