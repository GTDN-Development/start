import { type ComponentPropsWithoutRef } from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppHref } from "@/i18n/navigation";

const { getPathnameMock, useBrowserPathnameStateMock, useLocaleMock } = vi.hoisted(
  function hoistNavigationMocks() {
    return {
      getPathnameMock: vi.fn(),
      useBrowserPathnameStateMock: vi.fn(),
      useLocaleMock: vi.fn(),
    };
  }
);

vi.mock("@/i18n/navigation", function mockNavigation() {
  return {
    getPathname: getPathnameMock,
  };
});

vi.mock("@/hooks/use-browser-pathname-state", function mockBrowserPathnameState() {
  return {
    useBrowserPathnameState: useBrowserPathnameStateMock,
  };
});

vi.mock("next-intl", function mockNextIntl() {
  return {
    useLocale: useLocaleMock,
  };
});

vi.mock("@/components/layout/localized-nav-link", function mockLocalizedNavLink() {
  return {
    LocalizedNavLink: function LocalizedNavLink({
      href,
      ...props
    }: Omit<ComponentPropsWithoutRef<"a">, "href"> & {
      href: AppHref;
      locale: string;
    }) {
      const resolvedHref = typeof href === "string" ? href : href.pathname;

      return <a {...props} href={resolvedHref} />;
    },
  };
});

import { NavLink } from "./nav-link";

describe("NavLink", function describeNavLink() {
  beforeEach(function resetNavLinkMocks() {
    vi.clearAllMocks();
    useLocaleMock.mockReturnValue("cs");
    getPathnameMock.mockImplementation(function mockGetPathname({
      href,
      locale,
    }: {
      href: AppHref;
      locale: string;
    }) {
      if (typeof href === "string") {
        return `/${locale}${href}`;
      }

      let resolvedPathname: string = href.pathname;
      const params =
        "params" in href
          ? (href.params as Record<string, string | number | boolean | string[]>)
          : {};

      for (const [key, value] of Object.entries(params)) {
        const normalizedValue = Array.isArray(value) ? value.join("/") : String(value);

        resolvedPathname = resolvedPathname.replace(`[${key}]`, normalizedValue);
      }

      return `/${locale}${resolvedPathname}`;
    });
  });

  it("marks string href as current on exact pathname match", function testExactStringMatch() {
    useBrowserPathnameStateMock.mockReturnValue({
      navigationId: 1,
      pathname: "/cs/contact",
      previousPathname: "/cs",
    });

    render(<NavLink href="/contact">Contact</NavLink>);

    const link = screen.getByRole("link", { name: "Contact" });

    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.getAttribute("data-current")).toBe("true");
  });

  it("marks object href as current using its pathname", function testObjectHrefMatch() {
    useBrowserPathnameStateMock.mockReturnValue({
      navigationId: 2,
      pathname: "/cs/w/acme/settings",
      previousPathname: "/cs/app",
    });

    render(
      <NavLink
        href={{ pathname: "/w/[workspaceSlug]/settings", params: { workspaceSlug: "acme" } }}
      >
        Settings
      </NavLink>
    );

    const link = screen.getByRole("link", { name: "Settings" });

    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.getAttribute("data-current")).toBe("true");
  });

  it("marks nested routes as current when matchNested is enabled", function testNestedMatch() {
    useBrowserPathnameStateMock.mockReturnValue({
      navigationId: 3,
      pathname: "/cs/account/preferences",
      previousPathname: "/cs/account",
    });

    render(
      <NavLink href="/account" matchNested={true}>
        Account
      </NavLink>
    );

    const link = screen.getByRole("link", { name: "Account" });

    expect(link.getAttribute("aria-current")).toBe("page");
    expect(link.getAttribute("data-current")).toBe("true");
  });

  it("does not mark nested routes as current without matchNested", function testNestedMismatch() {
    useBrowserPathnameStateMock.mockReturnValue({
      navigationId: 4,
      pathname: "/cs/account/preferences",
      previousPathname: "/cs/account",
    });

    render(<NavLink href="/account">Account</NavLink>);

    const link = screen.getByRole("link", { name: "Account" });

    expect(link.getAttribute("aria-current")).toBeNull();
    expect(link.getAttribute("data-current")).toBeNull();
  });
});
