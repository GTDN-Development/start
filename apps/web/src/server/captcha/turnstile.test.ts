import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "./turnstile";

describe("verifyTurnstileToken", function describeVerifyTurnstileToken() {
  const originalEnv = process.env;

  beforeEach(function resetEnvironment() {
    process.env = { ...originalEnv };
    vi.restoreAllMocks();
  });

  afterEach(function restoreEnvironment() {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("returns a successful no-op result when Turnstile is disabled", async function testDisabledTurnstile() {
    const fetchMock = vi.fn();

    vi.stubGlobal("fetch", fetchMock);
    process.env.NEXT_PUBLIC_TURNSTILE_ENABLED = "false";
    delete process.env.TURNSTILE_SECRET_KEY;

    await expect(verifyTurnstileToken("token-value")).resolves.toEqual({
      success: true,
      hostname: "turnstile-disabled",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("returns a configuration error when Turnstile is enabled without a secret", async function testMissingSecret() {
    const fetchMock = vi.fn();

    vi.stubGlobal("fetch", fetchMock);
    process.env.NEXT_PUBLIC_TURNSTILE_ENABLED = "true";
    delete process.env.TURNSTILE_SECRET_KEY;

    await expect(verifyTurnstileToken("token-value")).resolves.toEqual({
      success: false,
      error: "Server configuration error - missing Turnstile secret key.",
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
