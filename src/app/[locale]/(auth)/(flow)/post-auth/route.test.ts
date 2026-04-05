import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { workspaceConfig } from "@/config/workspace";

vi.mock("@/i18n/navigation", function mockNavigation() {
  return {
    getPathname: vi.fn(function getPathname({
      href,
    }: {
      href: string | { pathname: string; params?: Record<string, string> };
    }) {
      if (typeof href === "string") {
        return href;
      }

      return href.pathname
        .replace("[token]", href.params?.token ?? "")
        .replace("[workspaceSlug]", href.params?.workspaceSlug ?? "");
    }),
  };
});

vi.mock("@/server/auth/auth-session-service", function mockAuthSessionService() {
  return {
    getResponseAuthSession: vi.fn(),
  };
});

vi.mock(
  "@/server/workspaces/workspace-resolution-service",
  function mockWorkspaceResolutionService() {
    return {
      resolvePostAuthDestination: vi.fn(),
    };
  }
);

vi.mock("@/server/workspaces/workspace-cookie", async function mockWorkspaceCookie() {
  const actual = await vi.importActual<typeof import("@/server/workspaces/workspace-cookie")>(
    "@/server/workspaces/workspace-cookie"
  );

  return {
    ...actual,
    getPendingInviteTokenCookie: vi.fn(),
  };
});

import { getResponseAuthSession } from "@/server/auth/auth-session-service";
import { resolvePostAuthDestination } from "@/server/workspaces/workspace-resolution-service";
import { getPendingInviteTokenCookie } from "@/server/workspaces/workspace-cookie";
import { GET } from "./route";

describe("post-auth route", function describePostAuthRoute() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("clears the pending invite cookie when redirecting to an invite", async function testInviteRedirect() {
    vi.mocked(getResponseAuthSession).mockResolvedValue({
      ok: true,
      data: {
        session: {
          user: {
            id: "user-1",
            email: "user@example.com",
          },
        },
      },
      setCookie: ["pb_auth=token; Path=/; HttpOnly"],
    } as Awaited<ReturnType<typeof getResponseAuthSession>>);
    vi.mocked(getPendingInviteTokenCookie).mockResolvedValue("invite-1");
    vi.mocked(resolvePostAuthDestination).mockResolvedValue({
      ok: true,
      data: {
        state: "invite_redirect",
        inviteToken: "invite-1",
      },
    } as Awaited<ReturnType<typeof resolvePostAuthDestination>>);

    const response = await GET(new NextRequest("https://example.com/cs/post-auth"), {
      params: Promise.resolve({
        locale: "cs",
      }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/invite/invite-1");
    expect(response.headers.get("set-cookie")).toContain("pb_auth=token");
    expect(response.headers.get("set-cookie")).toContain(
      `${workspaceConfig.cookies.pendingInvite.name}=`
    );
  });

  it("sets the active workspace cookie when redirecting to a workspace", async function testWorkspaceRedirect() {
    vi.mocked(getResponseAuthSession).mockResolvedValue({
      ok: true,
      data: {
        session: {
          user: {
            id: "user-1",
            email: "user@example.com",
          },
        },
      },
    } as Awaited<ReturnType<typeof getResponseAuthSession>>);
    vi.mocked(getPendingInviteTokenCookie).mockResolvedValue(null);
    vi.mocked(resolvePostAuthDestination).mockResolvedValue({
      ok: true,
      data: {
        state: "workspace_redirect",
        workspaceSlug: "team-space",
      },
    } as Awaited<ReturnType<typeof resolvePostAuthDestination>>);

    const response = await GET(new NextRequest("https://example.com/cs/post-auth"), {
      params: Promise.resolve({
        locale: "cs",
      }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/w/team-space/overview");
    expect(response.headers.get("set-cookie")).toContain(
      `${workspaceConfig.cookies.activeWorkspace.name}=team-space`
    );
  });
});
