import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { workspaceConfig } from "@/config/workspace";
import { resolveApplicationPostAuthState } from "@/features/application/application-composition";
import { getResponseAuthSession } from "@/server/auth/auth-session-service";
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

vi.mock("@/features/application/application-composition", function mockApplicationComposition() {
  return {
    resolveApplicationPostAuthState: vi.fn(),
  };
});

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

    const response = await GET(new NextRequest("https://example.com/cs/post-auth"), {
      params: Promise.resolve({
        locale: "cs",
      }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/sign-in");
    expect(response.headers.get("set-cookie")).toContain("pb_auth=");
    expect(resolveApplicationPostAuthState).not.toHaveBeenCalled();
  });

  it("redirects to app when no workspace-specific destination is available", async function testAppRedirect() {
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
    vi.mocked(resolveApplicationPostAuthState).mockResolvedValue({
      ok: true,
      data: {
        href: "/app",
      },
    } as Awaited<ReturnType<typeof resolveApplicationPostAuthState>>);

    const response = await GET(new NextRequest("https://example.com/cs/post-auth"), {
      params: Promise.resolve({
        locale: "cs",
      }),
    });

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/app");
    expect(response.headers.get("set-cookie")).toContain("pb_auth=token");
    expect(resolveApplicationPostAuthState).toHaveBeenCalledWith({
      userId: "user-1",
      userEmail: "user@example.com",
    });
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
    vi.mocked(resolveApplicationPostAuthState).mockResolvedValue({
      ok: true,
      data: {
        href: {
          pathname: "/invite/[token]",
          params: {
            token: "invite-1",
          },
        },
        clearPendingInviteToken: true,
      },
    } as Awaited<ReturnType<typeof resolveApplicationPostAuthState>>);

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
    vi.mocked(resolveApplicationPostAuthState).mockResolvedValue({
      ok: true,
      data: {
        href: {
          pathname: "/w/[workspaceSlug]/overview",
          params: {
            workspaceSlug: "team-space",
          },
        },
        activeWorkspaceSlug: "team-space",
      },
    } as Awaited<ReturnType<typeof resolveApplicationPostAuthState>>);

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
