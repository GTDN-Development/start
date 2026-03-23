"use client";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link, type LinkHref } from "@/components/ui/link";
import { usePathname } from "@/i18n/navigation";
import type { InnerSidebarNavItem } from "./inner-sidebar-types";

type InnerSidebarBreadcrumbsProps = {
  items: InnerSidebarNavItem[];
  rootHref: LinkHref;
  rootLabel: string;
  scopeLabel?: string;
  scopeHref?: LinkHref;
};

export function InnerSidebarBreadcrumbs({
  items,
  rootHref,
  rootLabel,
  scopeLabel,
  scopeHref,
}: InnerSidebarBreadcrumbsProps) {
  const pathname = usePathname();
  const currentItem = getCurrentInnerSidebarNavItem(pathname, items);
  const rootPathname = getHrefPathname(rootHref);
  const currentPathname = currentItem ? getHrefPathname(currentItem.href) : null;
  const showCurrentItem = currentItem !== null && currentPathname !== rootPathname;
  const showScope = Boolean(scopeLabel);

  if (!showCurrentItem) {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          {showScope && scopeLabel && (
            <>
              <BreadcrumbItem>
                {scopeHref ? (
                  <BreadcrumbLink render={<Link href={scopeHref} />}>{scopeLabel}</BreadcrumbLink>
                ) : (
                  <BreadcrumbPage>{scopeLabel}</BreadcrumbPage>
                )}
              </BreadcrumbItem>
              <BreadcrumbSeparator />
            </>
          )}
          <BreadcrumbItem>
            <BreadcrumbPage>{rootLabel}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    );
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        {showScope && scopeLabel && (
          <>
            <BreadcrumbItem>
              {scopeHref ? (
                <BreadcrumbLink render={<Link href={scopeHref} />}>{scopeLabel}</BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{scopeLabel}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        <BreadcrumbItem>
          <BreadcrumbLink render={<Link href={rootHref} />}>{rootLabel}</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{currentItem.label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}

function getCurrentInnerSidebarNavItem(pathname: string, items: InnerSidebarNavItem[]) {
  if (items.length === 0) {
    return null;
  }

  return items.find((item) => isCurrentInnerSidebarNavItem(pathname, item)) ?? null;
}

function isCurrentInnerSidebarNavItem(pathname: string, item: InnerSidebarNavItem) {
  const itemPathname = getHrefPathname(item.href);

  if (item.activePathnames?.includes(pathname)) {
    return true;
  }

  if (
    item.activePathPrefixes?.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }

  if (item.matchNested) {
    return pathname === itemPathname || pathname.startsWith(`${itemPathname}/`);
  }

  return pathname === itemPathname;
}

function getHrefPathname(href: LinkHref): string {
  if (typeof href === "string") {
    return href;
  }

  return href.pathname;
}
