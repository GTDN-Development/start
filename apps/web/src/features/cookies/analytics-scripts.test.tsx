"use client";

import type { ComponentProps } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  acceptAllConsent,
  COOKIE_NAME,
  serializeConsentCookieValue,
} from "@/config/cookie-consent";

vi.hoisted(function hoistCookieEnvironment() {
  process.env.NEXT_PUBLIC_COOKIE_CONSENT_ENABLED = "true";
  process.env.NEXT_PUBLIC_GA_ID = "ga-test-id";
  process.env.NEXT_PUBLIC_GTM_ID = "gtm-test-id";
});

const { persistCookieConsentAction } = vi.hoisted(function hoistCookieActionMocks() {
  return {
    persistCookieConsentAction: vi.fn(async function persistCookieConsentAction() {
      return undefined;
    }),
  };
});

vi.mock("@/hooks/use-hydrated", function mockUseHydrated() {
  return {
    useHydrated: vi.fn(function useHydrated() {
      return true;
    }),
  };
});

vi.mock("@/i18n/navigation", function mockNavigation() {
  return {
    Link: function Link(props: ComponentProps<"a">) {
      return <a {...props} />;
    },
    usePathname: vi.fn(function usePathname() {
      return "/pricing";
    }),
  };
});

vi.mock("next-intl", function mockNextIntl() {
  return {
    useLocale: vi.fn(function useLocale() {
      return "en";
    }),
    useTranslations: vi.fn(function useTranslations(namespace: string) {
      return function translate(key: string) {
        return `${namespace}.${key}`;
      };
    }),
  };
});

vi.mock("./cookie-consent-actions", function mockCookieConsentActions() {
  return {
    persistCookieConsentAction,
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

describe("cookie consent client bootstrap", function describeCookieConsentClientBootstrap() {
  beforeEach(function resetEnvironment() {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.NEXT_PUBLIC_COOKIE_CONSENT_ENABLED = "true";
    process.env.NEXT_PUBLIC_GA_ID = "ga-test-id";
    process.env.NEXT_PUBLIC_GTM_ID = "gtm-test-id";
    clearConsentCookie();
  });

  it("shows the consent banner for first-time visitors after hydration", async function testFirstVisitBanner() {
    const { CookieConsentBanner, CookieContextProvider } = await loadCookieUi();

    render(
      <CookieContextProvider>
        <CookieConsentBanner />
      </CookieContextProvider>
    );

    expect(await screen.findByText("cookies.consent.banner.title")).toBeDefined();
    expect(
      await screen.findByRole("button", { name: "cookies.consent.banner.acceptAll" })
    ).toBeDefined();
  });

  it("keeps the consent banner hidden for returning visitors with a current consent cookie", function testReturningVisitorBanner() {
    const bannerPromise = loadCookieUi();

    document.cookie = [
      `${COOKIE_NAME}=${serializeConsentCookieValue(acceptAllConsent)}`,
      "path=/",
    ].join("; ");

    return bannerPromise.then(function assertReturningVisitorBanner({
      CookieConsentBanner,
      CookieContextProvider,
    }) {
      render(
        <CookieContextProvider>
          <CookieConsentBanner />
        </CookieContextProvider>
      );

      expect(screen.queryByText("cookies.consent.banner.title")).toBeNull();
    });
  });

  it("does not mount analytics before consent and mounts GTM after accept all", async function testMountsGtmAfterConsent() {
    const { AnalyticsScripts, CookieContextProvider, useCookieContext } = await loadCookieUi();
    const ConsentTestHarness = createConsentTestHarness(useCookieContext, AnalyticsScripts);

    render(
      <CookieContextProvider>
        <ConsentTestHarness />
      </CookieContextProvider>
    );

    expect(screen.queryByTestId("google-analytics")).toBeNull();
    expect(screen.queryByTestId("google-tag-manager")).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "Accept all" }));

    await waitFor(function expectAnalyticsScripts() {
      expect(screen.getByTestId("google-tag-manager").textContent).toBe("gtm-test-id");
    });

    expect(screen.queryByTestId("google-analytics")).toBeNull();

    expect(persistCookieConsentAction).toHaveBeenCalledWith({
      eventType: "accept_all",
      consent: acceptAllConsent,
      locale: "en",
    });
  });

  it("mounts Google Analytics when GTM is not configured", async function testMountsGaFallback() {
    process.env.NEXT_PUBLIC_GTM_ID = "";

    const { AnalyticsScripts, CookieContextProvider } = await loadCookieUi();

    document.cookie = [
      `${COOKIE_NAME}=${serializeConsentCookieValue(acceptAllConsent)}`,
      "path=/",
    ].join("; ");

    render(
      <CookieContextProvider>
        <AnalyticsScripts />
      </CookieContextProvider>
    );

    expect((await screen.findByTestId("google-analytics")).textContent).toBe("ga-test-id");
    expect(screen.queryByTestId("google-tag-manager")).toBeNull();
  });

  it("mounts only GTM when both GTM and GA are configured", async function testGtmTakesPriority() {
    const { AnalyticsScripts, CookieContextProvider } = await loadCookieUi();

    document.cookie = [
      `${COOKIE_NAME}=${serializeConsentCookieValue(acceptAllConsent)}`,
      "path=/",
    ].join("; ");

    render(
      <CookieContextProvider>
        <AnalyticsScripts />
      </CookieContextProvider>
    );

    expect((await screen.findByTestId("google-tag-manager")).textContent).toBe("gtm-test-id");
    expect(screen.queryByTestId("google-analytics")).toBeNull();
  });

  it("mounts nothing when analytics consent is not granted", async function testNoAnalyticsWithoutConsent() {
    process.env.NEXT_PUBLIC_GTM_ID = "";

    const { AnalyticsScripts, CookieContextProvider } = await loadCookieUi();

    render(
      <CookieContextProvider>
        <AnalyticsScripts />
      </CookieContextProvider>
    );

    await waitFor(function expectNoAnalyticsScripts() {
      expect(screen.queryByTestId("google-analytics")).toBeNull();
      expect(screen.queryByTestId("google-tag-manager")).toBeNull();
    });
  });

  it("mounts nothing when cookie consent feature is disabled", async function testNoAnalyticsWhenConsentFeatureDisabled() {
    process.env.NEXT_PUBLIC_COOKIE_CONSENT_ENABLED = "false";

    const { AnalyticsScripts, CookieContextProvider } = await loadCookieUi();

    document.cookie = [
      `${COOKIE_NAME}=${serializeConsentCookieValue(acceptAllConsent)}`,
      "path=/",
    ].join("; ");

    render(
      <CookieContextProvider>
        <AnalyticsScripts />
      </CookieContextProvider>
    );

    await waitFor(function expectNoAnalyticsScripts() {
      expect(screen.queryByTestId("google-analytics")).toBeNull();
      expect(screen.queryByTestId("google-tag-manager")).toBeNull();
    });
  });
});

function createConsentTestHarness(
  useCookieContext: typeof import("./cookie-context").useCookieContext,
  AnalyticsScripts: typeof import("./analytics-scripts").AnalyticsScripts
) {
  function ConsentTestHarness() {
    const { acceptAll } = useCookieContext();

    return (
      <>
        <AnalyticsScripts />
        <button type="button" onClick={acceptAll}>
          Accept all
        </button>
      </>
    );
  }

  return ConsentTestHarness;
}

async function loadCookieUi() {
  const [
    { CookieConsentBanner },
    { CookieContextProvider, useCookieContext },
    { AnalyticsScripts },
  ] = await Promise.all([
    import("./cookie-consent-banner"),
    import("./cookie-context"),
    import("./analytics-scripts"),
  ]);

  return {
    AnalyticsScripts,
    CookieConsentBanner,
    CookieContextProvider,
    useCookieContext,
  };
}

function clearConsentCookie() {
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; path=/`;
}
