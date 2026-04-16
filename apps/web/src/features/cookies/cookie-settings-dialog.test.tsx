"use client";

import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { COOKIE_NAME } from "@/config/cookie-consent";

vi.hoisted(function hoistCookieEnvironment() {
  process.env.NEXT_PUBLIC_COOKIE_CONSENT_ENABLED = "true";
});

const { persistCookieConsentAction } = vi.hoisted(function hoistCookieActionMocks() {
  return {
    persistCookieConsentAction: vi.fn(async function persistCookieConsentAction() {
      return undefined;
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

vi.mock("@/components/ui/link", function mockLink() {
  return {
    Link: function Link(props: ComponentProps<"a">) {
      return <a {...props} />;
    },
  };
});

describe("cookie settings dialog", function describeCookieSettingsDialog() {
  beforeEach(function resetEnvironment() {
    vi.clearAllMocks();
    vi.resetModules();
    process.env.NEXT_PUBLIC_COOKIE_CONSENT_ENABLED = "true";
    clearConsentCookie();
  });

  it("opens the settings dialog when the trigger is clicked", async function testCookieSettingsTrigger() {
    const [{ CookieContextProvider }, { CookieSettingsDialog }, { CookieSettingsTrigger }] =
      await Promise.all([
        import("./cookie-context"),
        import("./cookie-settings-dialog"),
        import("./cookie-settings-trigger"),
      ]);

    render(
      <CookieContextProvider>
        <CookieSettingsTrigger type="button">Open settings</CookieSettingsTrigger>
        <CookieSettingsDialog />
      </CookieContextProvider>
    );

    fireEvent.click(screen.getByRole("button", { name: "Open settings" }));

    expect(await screen.findByText("cookies.consent.dialog.title")).toBeDefined();
  });

  it("does not render the trigger when cookie consent is disabled", async function testDisabledCookieSettingsTrigger() {
    process.env.NEXT_PUBLIC_COOKIE_CONSENT_ENABLED = "false";
    vi.resetModules();

    const [{ CookieSettingsTrigger }] = await Promise.all([import("./cookie-settings-trigger")]);

    render(<CookieSettingsTrigger type="button">Open settings</CookieSettingsTrigger>);

    expect(screen.queryByRole("button", { name: "Open settings" })).toBeNull();
  });
});

function clearConsentCookie() {
  document.cookie = `${COOKIE_NAME}=; Max-Age=0; path=/`;
}
