"use client";

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@marsidev/react-turnstile", function mockTurnstilePrimitive() {
  return {
    Turnstile: function MockTurnstile({ siteKey }: { siteKey: string }) {
      return <div data-testid="turnstile-widget">{siteKey}</div>;
    },
  };
});

describe("Turnstile", function describeTurnstile() {
  const originalEnv = process.env;

  beforeEach(function resetEnvironment() {
    process.env = { ...originalEnv };
    vi.resetModules();
  });

  afterEach(function restoreEnvironment() {
    process.env = originalEnv;
    vi.unstubAllEnvs();
  });

  it("shows a development placeholder when enabled without a site key", async function testMissingSiteKeyPlaceholder() {
    vi.stubEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_TURNSTILE_ENABLED = "true";
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    const { Turnstile } = await import("./turnstile");

    render(<Turnstile />);

    expect(screen.getByText("Missing Turnstile API key")).toBeDefined();
    expect(screen.queryByTestId("turnstile-widget")).toBeNull();
  });

  it("does not render a widget when Turnstile is disabled", async function testDisabledTurnstile() {
    vi.stubEnv("NODE_ENV", "development");
    process.env.NEXT_PUBLIC_TURNSTILE_ENABLED = "false";
    process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY = "site-key";

    const { Turnstile } = await import("./turnstile");

    render(<Turnstile />);

    expect(screen.queryByText("Missing Turnstile API key")).toBeNull();
    expect(screen.queryByTestId("turnstile-widget")).toBeNull();
  });
});
