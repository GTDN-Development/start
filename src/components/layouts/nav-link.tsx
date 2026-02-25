"use client";

import { Link, type LinkHref, type LinkProps } from "@/components/ui/link";
import { ComponentPropsWithoutRef } from "react";
import { useSelectedLayoutSegment } from "next/navigation";
import { ArrowUpRightIcon } from "lucide-react";

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
  const selectedLayoutSegment = useSelectedLayoutSegment();
  const pathname = selectedLayoutSegment ? `/${selectedLayoutSegment}` : "/";
  const hrefString = typeof href === "string" ? href : (href.pathname ?? "");

  const isCurrent = matchNested
    ? pathname === hrefString || pathname.startsWith(`${hrefString}/`)
    : pathname === hrefString;

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
    <Link
      {...props}
      href={href as LinkHref}
      aria-current={isCurrent ? "page" : undefined}
      data-current={isCurrent ? "true" : undefined}
      data-external={undefined}
      target={target}
      rel={rel}
    >
      {children}
    </Link>
  );
}

function isExternalHref(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}
