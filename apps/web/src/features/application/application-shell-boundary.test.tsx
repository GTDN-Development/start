import type PocketBase from "pocketbase";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { APP_HOME_PATH, getOrganizationOverviewHref } from "@/config/routes";
import { ApplicationShellBoundary } from "./application-shell-boundary";

const {
  getTranslationsMock,
  redirectMock,
  requireCurrentUserMock,
  buildApplicationShellModelMock,
  applicationRootMock,
  applicationOrganizationRootMock,
} = vi.hoisted(function hoistApplicationShellBoundaryMocks() {
  return {
    getTranslationsMock: vi.fn(),
    redirectMock: vi.fn(),
    requireCurrentUserMock: vi.fn(),
    buildApplicationShellModelMock: vi.fn(),
    applicationRootMock: vi.fn(),
    applicationOrganizationRootMock: vi.fn(),
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

vi.mock("@/server/auth/auth-session-service", function mockAuthSessionService() {
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

vi.mock("./application-organization-root", function mockApplicationOrganizationRoot() {
  return {
    ApplicationOrganizationRoot: applicationOrganizationRootMock,
  };
});

describe("application-shell-boundary", function describeApplicationShellBoundary() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    getTranslationsMock.mockResolvedValue(() => "label");
  });

  it("wraps the host root with organization navigation when the shell model includes organizations", async function testOrganizationShell() {
    const pb = createPocketBaseMock();

    requireCurrentUserMock.mockResolvedValue({
      ok: true,
      pb,
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
      },
    });
    buildApplicationShellModelMock.mockResolvedValue({
      ok: true,
      data: {
        applicationEntryHref: getOrganizationOverviewHref("team-space"),
        organizationNavigation: {
          activeOrganizationSlug: "team-space",
          organizations: [
            {
              id: "organization-1",
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
    const organizationRoot = getRenderedElement(result);
    const root = getRenderedElement(organizationRoot.props.children);

    expect(buildApplicationShellModelMock).toHaveBeenCalledWith({
      pb,
      user: {
        id: "user-1",
        email: "user@example.com",
        name: "User",
      },
    });
    expect(organizationRoot.type).toBe(applicationOrganizationRootMock);
    expect(organizationRoot.props.activeOrganizationSlug).toBe("team-space");
    expect(organizationRoot.props.organizations).toEqual([
      {
        id: "organization-1",
        slug: "team-space",
        name: "Team Space",
        avatarUrl: null,
        role: "owner",
      },
    ]);
    expect(root.type).toBe(applicationRootMock);
    expect(root.props.applicationEntryHref).toEqual(getOrganizationOverviewHref("team-space"));
  });

  it("wraps the host root with an empty organization snapshot when the shell model omits navigation", async function testHostOnlyShell() {
    const pb = createPocketBaseMock();

    requireCurrentUserMock.mockResolvedValue({
      ok: true,
      pb,
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
        organizationNavigation: null,
      },
    });

    const result = await ApplicationShellBoundary({
      children: null,
      params: Promise.resolve({
        locale: "cs",
      }),
    });
    const organizationRoot = getRenderedElement(result);
    const root = getRenderedElement(organizationRoot.props.children);

    expect(organizationRoot.type).toBe(applicationOrganizationRootMock);
    expect(organizationRoot.props.activeOrganizationSlug).toBeNull();
    expect(organizationRoot.props.organizations).toEqual([]);
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
