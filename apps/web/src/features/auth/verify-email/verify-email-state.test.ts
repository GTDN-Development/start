import { describe, expect, it } from "vitest";
import { createPendingVerifyEmailHref, parseVerifyEmailPageState } from "./verify-email-state";

describe("verify email state", function describeVerifyEmailState() {
  it("defaults delivery to sent for the pending state", function testDefaultDeliveryState() {
    const state = parseVerifyEmailPageState({
      email: "user@example.com",
    });

    expect(state).toEqual({
      token: null,
      email: "user@example.com",
      result: "pending",
      delivery: "sent",
    });
  });

  it("preserves the needs_resend delivery state in the verify email flow", function testNeedsResendDeliveryState() {
    const href = createPendingVerifyEmailHref({
      email: "User@Example.com",
      delivery: "needs_resend",
    });
    const state = parseVerifyEmailPageState({
      email: "user@example.com",
      delivery: "needs_resend",
    });

    expect(href).toContain("email=user%40example.com");
    expect(href).toContain("delivery=needs_resend");
    expect(state.delivery).toBe("needs_resend");
  });
});
