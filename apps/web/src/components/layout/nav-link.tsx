"use client";

import { LocalizedPathLink, type LinkProps } from "@/components/ui/link";
import { getPathname, type AppHref } from "@/i18n/navigation";
import { useBrowserPathnameState } from "@/hooks/use-browser-pathname-state";
import { ComponentPropsWithoutRef } from "react";
import { ArrowUpRightIcon } from "lucide-react";
import { useLocale } from "next-intl";

export type NavLinkProps = LinkProps & {
  showExternalIcon?: boolean;
  matchNested?: boolean;
};

export function NavLink({
  children,
  href,
  target,
  rel,
  showExternalIcon = false,
  matchNested = false,
  ...props
}: NavLinkProps) {
  const locale = useLocale();
  const { pathname } = useBrowserPathnameState();
  const localizedHref = resolveLocalizedHref(href, locale);

  const isCurrent = matchNested
    ? pathname === localizedHref || pathname?.startsWith(`${localizedHref}/`) === true
    : pathname === localizedHref;

  if (typeof href === "string" && isExternalHref(href)) {
    const externalProps = props as Omit<ComponentPropsWithoutRef<"a">, "href">;

    return (
      <a
        {...externalProps}
        href={href}
        aria-current={isCurrent ? "page" : undefined}
        data-current={isCurrent ? "true" : undefined}
        data-external="true"
        target={target || "_blank"}
        rel={rel || "noopener noreferrer"}
      >
        {children}
        {showExternalIcon && (
          <ArrowUpRightIcon aria-hidden="true" className="ml-1 inline size-[1em] opacity-50" />
        )}
      </a>
    );
  }

  return (
    <LocalizedPathLink
      {...props}
      href={localizedHref}
      aria-current={isCurrent ? "page" : undefined}
      data-current={isCurrent ? "true" : undefined}
      data-external={undefined}
      target={target}
      rel={rel}
    >
      {children}
    </LocalizedPathLink>
  );
}

function isExternalHref(href: string) {
  return (
    href.startsWith("#") ||
    href.startsWith("http://") ||
    href.startsWith("https://") ||
    href.startsWith("mailto:") ||
    href.startsWith("tel:")
  );
}

function resolveLocalizedHref(href: NavLinkProps["href"], locale: string) {
  if (typeof href === "string" && isExternalHref(href)) {
    return href;
  }

  return getPathname({
    href: href as AppHref,
    locale,
  });
}
