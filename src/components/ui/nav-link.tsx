"use client";

import { Link, type LinkProps } from "./link";
import { usePathname } from "next/navigation";
import { ArrowUpRightIcon } from "lucide-react";

export function NavLink({
  children,
  href,
  target,
  rel,
  showExternalIcon = false,
  ...props
}: LinkProps & { showExternalIcon?: boolean }) {
  const pathname = usePathname();
  const isCurrent = pathname === href;
  const isExternal = href.startsWith("http");

  return (
    <Link
      {...props}
      href={href}
      aria-current={isCurrent ? "page" : undefined}
      data-current={isCurrent ? "true" : undefined}
      data-external={isExternal ? "true" : undefined}
      target={isExternal ? target || "_blank" : undefined}
      rel={isExternal ? rel || "noopener noreferrer" : undefined}
    >
      {children}
      {isExternal && showExternalIcon && (
        <ArrowUpRightIcon aria-hidden="true" className="ml-1 inline size-[1em] opacity-50" />
      )}
    </Link>
  );
}
