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
  "@/server/workspaces/workspace-invite-recipient-service",
  function mockWorkspaceInviteRecipientService() {
    return {
      acceptInviteTokenForUser: vi.fn(),
      getInviteTokenForUser: vi.fn(),
    };
  }
);

import { getResponseAuthSession } from "@/server/auth/auth-session-service";
import {
  acceptInviteTokenForUser,
  getInviteTokenForUser,
} from "@/server/workspaces/workspace-invite-recipient-service";
import { GET, POST } from "./route";

describe("invite accept route", function describeInviteAcceptRoute() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated requests to invite start and forwards auth cookies", async function testUnauthenticatedRedirect() {
    vi.mocked(getResponseAuthSession).mockResolvedValue({
      ok: true,
      data: {
        session: null,
      },
      setCookie: ["pb_auth=; Max-Age=0; Path=/; HttpOnly"],
    } as Awaited<ReturnType<typeof getResponseAuthSession>>);

    const response = await GET(
      new NextRequest("https://example.com/cs/invite/invite-token/accept"),
      {
        params: Promise.resolve({
          locale: "cs",
          token: "invite-token",
        }),
      }
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/invite/invite-token/start");
    expect(response.headers.get("set-cookie")).toContain("pb_auth=");
    expect(getInviteTokenForUser).not.toHaveBeenCalled();
  });

  it("redirects already-member GET requests to the workspace and sets active workspace", async function testAlreadyMemberRedirect() {
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
    vi.mocked(getInviteTokenForUser).mockResolvedValue({
      ok: true,
      data: {
        result: {
          state: "already_member",
          workspace: {
            id: "workspace-1",
            name: "Team Space",
            slug: "team-space",
            avatarUrl: null,
            memberCount: 3,
          },
        },
      },
    } as Awaited<ReturnType<typeof getInviteTokenForUser>>);

    const response = await GET(
      new NextRequest("https://example.com/cs/invite/invite-token/accept"),
      {
        params: Promise.resolve({
          locale: "cs",
          token: "invite-token",
        }),
      }
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/w/team-space/overview");
    expect(response.headers.get("set-cookie")).toContain(
      `${workspaceConfig.cookies.activeWorkspace.name}=team-space`
    );
  });

  it("redirects accepted POST requests to the workspace and sets active workspace", async function testAcceptedRedirect() {
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
    vi.mocked(acceptInviteTokenForUser).mockResolvedValue({
      ok: true,
      data: {
        result: {
          state: "accepted",
          workspace: {
            id: "workspace-1",
            name: "Team Space",
            slug: "team-space",
            avatarUrl: null,
            memberCount: 3,
          },
        },
      },
    } as Awaited<ReturnType<typeof acceptInviteTokenForUser>>);

    const response = await POST(
      new NextRequest("https://example.com/cs/invite/invite-token/accept", {
        method: "POST",
      }),
      {
        params: Promise.resolve({
          locale: "cs",
          token: "invite-token",
        }),
      }
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/w/team-space/overview");
    expect(response.headers.get("set-cookie")).toContain("pb_auth=token");
    expect(response.headers.get("set-cookie")).toContain(
      `${workspaceConfig.cookies.activeWorkspace.name}=team-space`
    );
  });
});
