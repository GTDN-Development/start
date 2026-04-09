"use client";

import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Turnstile } from "./turnstile";

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
  });

  afterEach(function restoreEnvironment() {
    process.env = originalEnv;
  });

  it("shows a development placeholder when enabled without a site key", function testMissingSiteKeyPlaceholder() {
    process.env = {
      ...process.env,
      NODE_ENV: "development",
      NEXT_PUBLIC_TURNSTILE_ENABLED: "true",
    };
    delete process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    render(<Turnstile />);

    expect(screen.getByText("Missing Turnstile API key")).toBeDefined();
    expect(screen.queryByTestId("turnstile-widget")).toBeNull();
  });
});
