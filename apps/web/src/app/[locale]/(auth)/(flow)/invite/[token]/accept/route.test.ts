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

    const response = await getInviteAcceptResponse("GET");

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/invite/invite-token/start");
    expect(response.headers.get("set-cookie")).toContain("pb_auth=");
    expect(getInviteTokenForUser).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "redirects already-member GET requests to the workspace and sets active workspace",
      method: "GET" as const,
      authSession: createAuthenticatedSessionResponse(),
      inviteResponse: {
        ok: true,
        data: {
          result: {
            state: "already_member",
            workspace: createWorkspaceSummary(),
          },
        },
      } as Awaited<ReturnType<typeof getInviteTokenForUser>>,
      expectedCookie: `${workspaceConfig.cookies.activeWorkspace.name}=team-space`,
    },
    {
      name: "redirects accepted POST requests to the workspace and sets active workspace",
      method: "POST" as const,
      authSession: createAuthenticatedSessionResponse(["pb_auth=token; Path=/; HttpOnly"]),
      inviteResponse: {
        ok: true,
        data: {
          result: {
            state: "accepted",
            workspace: createWorkspaceSummary(),
          },
        },
      } as Awaited<ReturnType<typeof acceptInviteTokenForUser>>,
      expectedCookie: "pb_auth=token",
    },
  ])("$name", async function testAcceptedInviteRedirects(input) {
    vi.mocked(getResponseAuthSession).mockResolvedValue(input.authSession);

    if (input.method === "GET") {
      vi.mocked(getInviteTokenForUser).mockResolvedValue(input.inviteResponse);
    } else {
      vi.mocked(acceptInviteTokenForUser).mockResolvedValue(input.inviteResponse);
    }

    const response = await getInviteAcceptResponse(input.method);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/w/team-space/overview");
    expect(response.headers.get("set-cookie")).toContain(input.expectedCookie);
    expect(response.headers.get("set-cookie")).toContain(
      `${workspaceConfig.cookies.activeWorkspace.name}=team-space`
    );
  });
});

function createAuthenticatedSessionResponse(setCookie?: string[]) {
  return {
    ok: true,
    data: {
      session: {
        user: {
          id: "user-1",
          email: "user@example.com",
        },
      },
    },
    setCookie,
  } as Awaited<ReturnType<typeof getResponseAuthSession>>;
}

function createWorkspaceSummary() {
  return {
    id: "workspace-1",
    name: "Team Space",
    slug: "team-space",
    avatarUrl: null,
  };
}

async function getInviteAcceptResponse(method: "GET" | "POST") {
  const request = new NextRequest("https://example.com/cs/invite/invite-token/accept", {
    method,
  });
  const context = {
    params: Promise.resolve({
      locale: "cs",
      token: "invite-token",
    }),
  };

  return method === "GET" ? GET(request, context) : POST(request, context);
}
