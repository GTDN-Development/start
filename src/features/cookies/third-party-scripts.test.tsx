"use client";

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CookieContextProvider, useCookieContext } from "./cookie-context";
import { defaultConsent } from "./cookie-consent";
import { ThirdPartyScripts } from "./third-party-scripts";

const refresh = vi.fn();

vi.mock("@/i18n/navigation", function mockNavigation() {
  return {
    useRouter: vi.fn(function useRouter() {
      return {
        refresh,
      };
    }),
  };
});

vi.mock("next-intl", function mockNextIntl() {
  return {
    useLocale: vi.fn(function useLocale() {
      return "en";
    }),
  };
});

vi.mock("./cookie-consent-actions", function mockCookieConsentActions() {
  return {
    persistCookieConsentAction: vi.fn(async function persistCookieConsentAction() {
      return undefined;
    }),
  };
});

vi.mock("@next/third-parties/google", function mockGoogleThirdParties() {
  return {
    GoogleAnalytics: function GoogleAnalytics({ gaId }: { gaId: string }) {
      return <div data-testid="google-analytics">{gaId}</div>;
    },
    GoogleTagManager: function GoogleTagManager({ gtmId }: { gtmId: string }) {
      return <div data-testid="google-tag-manager">{gtmId}</div>;
    },
  };
});

describe("third-party scripts", function describeThirdPartyScripts() {
  beforeEach(function resetEnvironment() {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_COOKIE_CONSENT_ENABLED = "true";
    process.env.NEXT_PUBLIC_GA_ID = "ga-test-id";
    process.env.NEXT_PUBLIC_GTM_ID = "gtm-test-id";
  });

  it("updates analytics scripts from cookie context without a router refresh", async function testConsentUpdate() {
    render(
      <CookieContextProvider initialConsent={defaultConsent} initialHasInteracted={false}>
        <ConsentTestHarness />
      </CookieContextProvider>
    );

    expect(screen.queryByTestId("google-analytics")).toBeNull();
    expect(screen.queryByTestId("google-tag-manager")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));

    await waitFor(function expectAnalyticsScripts() {
      expect(screen.getByTestId("google-analytics").textContent).toBe("ga-test-id");
      expect(screen.getByTestId("google-tag-manager").textContent).toBe("gtm-test-id");
    });

    expect(refresh).not.toHaveBeenCalled();
  });
});

function ConsentTestHarness() {
  const { acceptAll } = useCookieContext();

  return (
    <>
      <ThirdPartyScripts />
      <button type="button" onClick={acceptAll}>
        Accept all
      </button>
    </>
  );
}
