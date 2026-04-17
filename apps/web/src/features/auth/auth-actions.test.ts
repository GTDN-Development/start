import { beforeEach, describe, expect, it, vi } from "vitest";
import { headers } from "next/headers";
import { getClientIPFromHeaders, verifyTurnstileToken } from "@/server/captcha/turnstile";
import { requestPasswordResetForEmail } from "@/server/auth/auth-password-reset-service";
import { signUpWithPassword } from "@/server/auth/auth-sign-up-service";
import { requestPasswordResetAction, signUpAction } from "./auth-actions";

vi.mock("next/headers", function mockNextHeaders() {
  return {
    headers: vi.fn(),
  };
});

vi.mock("@/config/security", function mockSecurityConfig() {
  return {
    isTurnstileEnabled() {
      return true;
    },
  };
});

vi.mock("@/server/captcha/turnstile", function mockTurnstile() {
  return {
    getClientIPFromHeaders: vi.fn(),
    verifyTurnstileToken: vi.fn(),
  };
});

vi.mock("@/server/auth/auth-cookies", function mockAuthCookies() {
  return {
    applyServerActionAuthCookies: vi.fn(),
  };
});

vi.mock("@/server/auth/auth-password-reset-service", function mockAuthPasswordResetService() {
  return {
    confirmPasswordResetToken: vi.fn(),
    requestPasswordResetForEmail: vi.fn(),
  };
});

vi.mock("@/server/auth/auth-sign-up-service", function mockAuthSignUpService() {
  return {
    signUpWithPassword: vi.fn(),
  };
});

vi.mock("@/server/auth/auth-session-service", function mockAuthSessionService() {
  return {
    signInWithPassword: vi.fn(),
    signOutServerSession: vi.fn(),
  };
});

vi.mock(
  "@/server/auth/auth-email-verification-service",
  function mockAuthEmailVerificationService() {
    return {
      confirmEmailChangeToken: vi.fn(),
      requestEmailVerificationForEmail: vi.fn(),
    };
  }
);

vi.mock("@/server/application/application-session-state", function mockApplicationSessionState() {
  return {
    clearSessionScopedApplicationState: vi.fn(),
  };
});

describe("auth-actions", function describeAuthActions() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
    vi.mocked(headers).mockResolvedValue(new Headers());
    vi.mocked(getClientIPFromHeaders).mockReturnValue("127.0.0.1");
    vi.mocked(verifyTurnstileToken).mockResolvedValue({
      success: false,
      errorCodes: ["invalid-input-response"],
    });
  });

  it.each([
    {
      name: "sign-up",
      action: () =>
        signUpAction({
          firstName: "Ada",
          lastName: "Lovelace",
          email: "ada@example.com",
          password: "correct-horse-battery-staple",
          turnstileToken: "turnstile-token",
        }),
      sideEffect: signUpWithPassword,
    },
    {
      name: "password reset",
      action: () =>
        requestPasswordResetAction({
          email: "ada@example.com",
          turnstileToken: "turnstile-token",
        }),
      sideEffect: requestPasswordResetForEmail,
    },
  ])(
    "fails closed on $name turnstile verification errors",
    async function testTurnstileFailure(input) {
      const response = await input.action();

      expect(response).toEqual({
        ok: false,
        errorCode: "TURNSTILE_VERIFICATION_FAILED",
      });
      expect(verifyTurnstileToken).toHaveBeenCalledWith("turnstile-token", "127.0.0.1");
      expect(input.sideEffect).not.toHaveBeenCalled();
    }
  );
});
