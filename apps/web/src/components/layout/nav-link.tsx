"use client";

import { LocalizedNavLink } from "@/components/layout/localized-nav-link";
import { useBrowserPathnameState } from "@/hooks/use-browser-pathname-state";
import { type AppHref, getPathname } from "@/i18n/navigation";
import { type ComponentPropsWithRef } from "react";
import { type Locale, useLocale } from "next-intl";

type ResolveNavLinkStateOptions = {
  href: AppHref;
  locale: Locale;
  pathname: string | null;
  matchNested?: boolean;
};

export type NavLinkProps = Omit<ComponentPropsWithRef<typeof LocalizedNavLink>, "locale"> & {
  matchNested?: boolean;
};

export function resolveNavLinkState({
  href,
  locale,
  pathname,
  matchNested = false,
}: ResolveNavLinkStateOptions) {
  const resolvedHref = getPathname({ href, locale });
  const isCurrent =
    pathname !== null &&
    (matchNested
      ? pathname === resolvedHref || pathname.startsWith(`${resolvedHref}/`)
      : pathname === resolvedHref);

  return {
    isCurrent,
    resolvedHref,
  };
}

export function NavLink({ href, matchNested = false, ref, ...props }: NavLinkProps) {
  const locale = useLocale();
  const { pathname } = useBrowserPathnameState();
  const { isCurrent } = resolveNavLinkState({
    href,
    locale,
    pathname,
    matchNested,
  });

  return (
    <LocalizedNavLink
      {...props}
      ref={ref}
      href={href}
      locale={locale}
      aria-current={isCurrent ? "page" : undefined}
      data-current={isCurrent ? "true" : undefined}
    />
  );
}
