import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { workspaceConfig } from "@/config/workspace";
import { getResponseAuthSession } from "@/server/auth/auth-session-service";
import { resolvePostAuthDestinationForUser } from "@/server/workspaces/workspace-resolution-service";
import { GET } from "./route";

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
      resolvePostAuthDestinationForUser: vi.fn(),
    };
  }
);

describe("post-auth route", function describePostAuthRoute() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("redirects unauthenticated requests to sign-in and forwards auth cookies", async function testUnauthorizedRedirect() {
    vi.mocked(getResponseAuthSession).mockResolvedValue({
      ok: true,
      data: {
        session: null,
      },
      setCookie: ["pb_auth=; Max-Age=0; Path=/; HttpOnly"],
    } as Awaited<ReturnType<typeof getResponseAuthSession>>);

    const response = await getPostAuthResponse();

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/sign-in");
    expect(response.headers.get("set-cookie")).toContain("pb_auth=");
    expect(resolvePostAuthDestinationForUser).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "redirects to app when no workspace-specific destination is available",
      authResponse: createAuthenticatedSessionResponse(["pb_auth=token; Path=/; HttpOnly"]),
      destination: {
        ok: true,
        data: {
          state: "app",
        },
      } as Awaited<ReturnType<typeof resolvePostAuthDestinationForUser>>,
      expectedLocation: "https://example.com/app",
      expectedCookies: ["pb_auth=token"],
    },
    {
      name: "clears the pending invite cookie when redirecting to an invite",
      authResponse: createAuthenticatedSessionResponse(["pb_auth=token; Path=/; HttpOnly"]),
      destination: {
        ok: true,
        data: {
          state: "invite_redirect",
          inviteToken: "invite-1",
        },
      } as Awaited<ReturnType<typeof resolvePostAuthDestinationForUser>>,
      expectedLocation: "https://example.com/invite/invite-1",
      expectedCookies: ["pb_auth=token", `${workspaceConfig.cookies.pendingInvite.name}=`],
    },
    {
      name: "sets the active workspace cookie when redirecting to a workspace",
      authResponse: createAuthenticatedSessionResponse(),
      destination: {
        ok: true,
        data: {
          state: "workspace_redirect",
          workspaceSlug: "team-space",
        },
      } as Awaited<ReturnType<typeof resolvePostAuthDestinationForUser>>,
      expectedLocation: "https://example.com/w/team-space/overview",
      expectedCookies: [`${workspaceConfig.cookies.activeWorkspace.name}=team-space`],
    },
  ])("$name", async function testPostAuthRedirects(input) {
    vi.mocked(getResponseAuthSession).mockResolvedValue(input.authResponse);
    vi.mocked(resolvePostAuthDestinationForUser).mockResolvedValue(input.destination);

    const response = await getPostAuthResponse();

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(input.expectedLocation);
    for (const expectedCookie of input.expectedCookies) {
      expect(response.headers.get("set-cookie")).toContain(expectedCookie);
    }
    expect(resolvePostAuthDestinationForUser).toHaveBeenCalledWith({
      userId: "user-1",
    });
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

async function getPostAuthResponse() {
  return GET(new NextRequest("https://example.com/cs/post-auth"), {
    params: Promise.resolve({
      locale: "cs",
    }),
  });
}
