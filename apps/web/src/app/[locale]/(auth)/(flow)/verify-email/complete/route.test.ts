import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/i18n/navigation", function mockNavigation() {
  return {
    getPathname: vi.fn(function getPathname({ href }: { href: string }) {
      return href;
    }),
  };
});

vi.mock(
  "@/server/auth/auth-email-verification-service",
  function mockAuthEmailVerificationService() {
    return {
      confirmEmailVerificationToken: vi.fn(),
    };
  }
);

import { confirmEmailVerificationToken } from "@/server/auth/auth-email-verification-service";
import { GET } from "./route";

describe("verify-email completion route", function describeVerifyEmailCompletionRoute() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("redirects verified sessions through the post-auth handler and forwards auth cookies", async function testPostAuthRedirect() {
    vi.mocked(confirmEmailVerificationToken).mockResolvedValue({
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
    } as Awaited<ReturnType<typeof confirmEmailVerificationToken>>);

    const response = await GET(
      new NextRequest("https://example.com/cs/verify-email/complete?token=verification-token"),
      {
        params: Promise.resolve({
          locale: "cs",
        }),
      }
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://example.com/post-auth");
    expect(response.headers.get("set-cookie")).toContain("pb_auth=token");
  });
});
