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

      return href.pathname.replace("[token]", href.params?.token ?? "");
    }),
  };
});

vi.mock(
  "@/server/workspaces/workspace-invite-recipient-service",
  function mockWorkspaceInviteRecipientService() {
    return {
      validateInviteToken: vi.fn(),
    };
  }
);

import { validateInviteToken } from "@/server/workspaces/workspace-invite-recipient-service";
import { GET } from "./route";

describe("invite start route", function describeInviteStartRoute() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it.each([
    {
      name: "sets the pending invite cookie and redirects to sign-in for valid invites",
      isValid: true,
      expectedLocation: "https://example.com/sign-in",
      expectedSetCookie: `${workspaceConfig.cookies.pendingInvite.name}=invite-token`,
    },
    {
      name: "redirects back to the invite page without setting cookies when the invite is invalid",
      isValid: false,
      expectedLocation: "https://example.com/invite/invite-token",
      expectedSetCookie: null,
    },
  ])("$name", async function testInviteStartRedirect(input) {
    vi.mocked(validateInviteToken).mockResolvedValue({
      ok: true,
      data: {
        isValid: input.isValid,
      },
    } as Awaited<ReturnType<typeof validateInviteToken>>);

    const response = await getInviteStartResponse();

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(input.expectedLocation);
    if (input.expectedSetCookie) {
      expect(response.headers.get("set-cookie")).toContain(input.expectedSetCookie);
      return;
    }

    expect(response.headers.get("set-cookie")).toBeNull();
  });
});

async function getInviteStartResponse() {
  return GET(new NextRequest("https://example.com/cs/invite/invite-token/start"), {
    params: Promise.resolve({
      locale: "cs",
      token: "invite-token",
    }),
  });
}
