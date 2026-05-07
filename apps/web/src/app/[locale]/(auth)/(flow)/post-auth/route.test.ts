import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { organizationConfig } from "@/config/organization";
import type { AuthCookieMutation } from "@/server/auth/auth-cookies";
import { getResponseAuthSession } from "@/server/auth/auth-session-service";
import { resolvePostAuthDestinationForUser } from "@/server/organizations/organization-shell-queries";
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
        .replace("[organizationSlug]", href.params?.organizationSlug ?? "");
    }),
  };
});

vi.mock("@/server/auth/auth-session-service", function mockAuthSessionService() {
  return {
    getResponseAuthSession: vi.fn(),
  };
});

vi.mock(
  "@/server/organizations/organization-shell-queries",
  function mockOrganizationShellQueries() {
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
      cookieMutations: [createCookieMutation("pb_auth", "", { maxAge: 0, httpOnly: true })],
    } as Awaited<ReturnType<typeof getResponseAuthSession>>);

    const response = await getPostAuthResponse();
    const setCookieHeader = getSetCookieHeader(response);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/sign-in");
    expect(setCookieHeader).toContain("pb_auth=");
    expect(resolvePostAuthDestinationForUser).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "redirects to app when no organization-specific destination is available",
      authResponse: createAuthenticatedSessionResponse([
        createCookieMutation("pb_auth", "token", { path: "/", httpOnly: true }),
      ]),
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
      authResponse: createAuthenticatedSessionResponse([
        createCookieMutation("pb_auth", "token", { path: "/", httpOnly: true }),
      ]),
      destination: {
        ok: true,
        data: {
          state: "invite_redirect",
          inviteToken: "invite-1",
        },
      } as Awaited<ReturnType<typeof resolvePostAuthDestinationForUser>>,
      expectedLocation: "https://example.com/invite/invite-1",
      expectedCookies: ["pb_auth=token", `${organizationConfig.cookies.pendingInvite.name}=`],
    },
    {
      name: "sets the active organization cookie when redirecting to an organization",
      authResponse: createAuthenticatedSessionResponse(),
      destination: {
        ok: true,
        data: {
          state: "organization_redirect",
          organizationSlug: "team-space",
        },
      } as Awaited<ReturnType<typeof resolvePostAuthDestinationForUser>>,
      expectedLocation: "https://example.com/o/team-space/overview",
      expectedCookies: [`${organizationConfig.cookies.activeOrganization.name}=team-space`],
    },
  ])("$name", async function testPostAuthRedirects(input) {
    vi.mocked(getResponseAuthSession).mockResolvedValue(input.authResponse);
    vi.mocked(resolvePostAuthDestinationForUser).mockResolvedValue(input.destination);

    const response = await getPostAuthResponse();
    const setCookieHeader = getSetCookieHeader(response);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(input.expectedLocation);
    for (const expectedCookie of input.expectedCookies) {
      expect(setCookieHeader).toContain(expectedCookie);
    }
    expect(resolvePostAuthDestinationForUser).toHaveBeenCalledWith({
      userId: "user-1",
    });
  });
});

function createAuthenticatedSessionResponse(cookieMutations?: AuthCookieMutation[]) {
  return {
    ok: true,
    data: {
      session: {
        user: {
          id: "user-1",
          email: "user@example.com",
          name: null,
          avatarUrl: null,
        },
      },
    },
    cookieMutations,
  } as Awaited<ReturnType<typeof getResponseAuthSession>>;
}

function createCookieMutation(
  name: string,
  value: string,
  options: Partial<AuthCookieMutation> = {}
): AuthCookieMutation {
  return {
    name,
    value,
    ...options,
  };
}

async function getPostAuthResponse() {
  return GET(new NextRequest("https://example.com/cs/post-auth"), {
    params: Promise.resolve({
      locale: "cs",
    }),
  });
}

function getSetCookieHeader(response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  return headers.getSetCookie?.().join("; ") ?? headers.get("set-cookie") ?? "";
}
