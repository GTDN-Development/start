import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { organizationConfig } from "@/config/organization";
import type { AuthCookieMutation } from "@/server/auth/auth-cookies";

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
  "@/server/organizations/organization-invite-recipient-service",
  function mockOrganizationInviteRecipientService() {
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
} from "@/server/organizations/organization-invite-recipient-service";
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
      cookieMutations: [createCookieMutation("pb_auth", "", { maxAge: 0, httpOnly: true })],
    } as Awaited<ReturnType<typeof getResponseAuthSession>>);

    const response = await getInviteAcceptResponse("GET");
    const setCookieHeader = getSetCookieHeader(response);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/invite/invite-token/start");
    expect(setCookieHeader).toContain("pb_auth=");
    expect(getInviteTokenForUser).not.toHaveBeenCalled();
  });

  it.each([
    {
      name: "redirects already-member GET requests to the organization and sets active organization",
      method: "GET" as const,
      authSession: createAuthenticatedSessionResponse(),
      inviteResponse: {
        ok: true,
        data: {
          result: {
            state: "already_member",
            organization: createOrganizationSummary(),
          },
        },
      } as Awaited<ReturnType<typeof getInviteTokenForUser>>,
      expectedCookie: `${organizationConfig.cookies.activeOrganization.name}=team-space`,
    },
    {
      name: "redirects accepted POST requests to the organization and sets active organization",
      method: "POST" as const,
      authSession: createAuthenticatedSessionResponse([
        createCookieMutation("pb_auth", "token", { path: "/", httpOnly: true }),
      ]),
      inviteResponse: {
        ok: true,
        data: {
          result: {
            state: "accepted",
            organization: createOrganizationSummary(),
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
    const setCookieHeader = getSetCookieHeader(response);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/o/team-space/overview");
    expect(setCookieHeader).toContain(input.expectedCookie);
    expect(setCookieHeader).toContain(
      `${organizationConfig.cookies.activeOrganization.name}=team-space`
    );
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

function createOrganizationSummary() {
  return {
    id: "organization-1",
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

function getSetCookieHeader(response: Response) {
  const headers = response.headers as Headers & {
    getSetCookie?: () => string[];
  };

  return headers.getSetCookie?.().join("; ") ?? headers.get("set-cookie") ?? "";
}
