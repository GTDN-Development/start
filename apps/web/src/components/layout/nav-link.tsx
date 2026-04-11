"use client";

import { LocalizedNavLink } from "@/components/layout/localized-nav-link";
import { useBrowserPathnameState } from "@/hooks/use-browser-pathname-state";
import { getPathname } from "@/i18n/navigation";
import { type ComponentPropsWithoutRef } from "react";
import { useLocale } from "next-intl";

export type NavLinkProps = Omit<ComponentPropsWithoutRef<typeof LocalizedNavLink>, "locale"> & {
  matchNested?: boolean;
};

export function NavLink({ href, matchNested = false, ...props }: NavLinkProps) {
  const locale = useLocale();
  const { pathname } = useBrowserPathnameState();
  const resolvedHref = getPathname({ href, locale });

  const isCurrent =
    pathname !== null &&
    (matchNested
      ? pathname === resolvedHref || pathname.startsWith(`${resolvedHref}/`)
      : pathname === resolvedHref);

  return (
    <LocalizedNavLink
      {...props}
      href={href}
      locale={locale}
      aria-current={isCurrent ? "page" : undefined}
      data-current={isCurrent ? "true" : undefined}
    />
  );
}
