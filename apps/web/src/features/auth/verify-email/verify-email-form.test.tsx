"use client";

import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestEmailVerificationAction } = vi.hoisted(function hoistAuthActionMocks() {
  return {
    requestEmailVerificationAction: vi.fn(),
  };
});

vi.mock("next-intl", function mockNextIntl() {
  return {
    useTranslations: vi.fn(function useTranslations(namespace: string) {
      return function translate(key: string) {
        return `${namespace}.${key}`;
      };
    }),
  };
});

vi.mock("@/components/ui/link", function mockLink() {
  return {
    Link: function Link(props: ComponentProps<"a">) {
      return <a {...props} />;
    },
  };
});

vi.mock("@/features/auth/auth-actions", function mockAuthActions() {
  return {
    requestEmailVerificationAction,
  };
});

describe("verify email form", function describeVerifyEmailForm() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  it("renders the needs_resend warning and keeps the resend action available", async function testNeedsResendState() {
    const { VerifyEmailForm } = await import("./verify-email-form");

    render(<VerifyEmailForm email="user@example.com" result="pending" delivery="needs_resend" />);

    expect(screen.getByText("forms.verifyEmail.status.needsResend.title")).toBeDefined();
    expect(screen.getByText("forms.verifyEmail.status.needsResend.message")).toBeDefined();
    expect(screen.getByRole("button", { name: "forms.verifyEmail.actions.resend" })).toBeDefined();
  });

  it("does not repeat the verified status inside the form body", async function testVerifiedState() {
    const { VerifyEmailForm } = await import("./verify-email-form");

    render(<VerifyEmailForm email="user@example.com" result="verified" delivery="sent" />);

    expect(screen.queryByText("forms.verifyEmail.status.verified.title")).toBeNull();
    expect(screen.queryByText("forms.verifyEmail.status.verified.message")).toBeNull();
    expect(screen.getByRole("button", { name: "forms.verifyEmail.actions.signIn" })).toBeDefined();
  });
});
