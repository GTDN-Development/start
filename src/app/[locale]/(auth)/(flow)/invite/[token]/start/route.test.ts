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

  it("sets the pending invite cookie and redirects to sign-in for valid invites", async function testValidInviteRedirect() {
    vi.mocked(validateInviteToken).mockResolvedValue({
      ok: true,
      data: {
        isValid: true,
      },
    } as Awaited<ReturnType<typeof validateInviteToken>>);

    const response = await GET(
      new NextRequest("https://example.com/cs/invite/invite-token/start"),
      {
        params: Promise.resolve({
          locale: "cs",
          token: "invite-token",
        }),
      }
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/sign-in");
    expect(response.headers.get("set-cookie")).toContain(
      `${workspaceConfig.cookies.pendingInvite.name}=invite-token`
    );
  });

  it("redirects back to the invite page without setting cookies when the invite is invalid", async function testInvalidInviteRedirect() {
    vi.mocked(validateInviteToken).mockResolvedValue({
      ok: true,
      data: {
        isValid: false,
      },
    } as Awaited<ReturnType<typeof validateInviteToken>>);

    const response = await GET(
      new NextRequest("https://example.com/cs/invite/invite-token/start"),
      {
        params: Promise.resolve({
          locale: "cs",
          token: "invite-token",
        }),
      }
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://example.com/invite/invite-token");
    expect(response.headers.get("set-cookie")).toBeNull();
  });
});
