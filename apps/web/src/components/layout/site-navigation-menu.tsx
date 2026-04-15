"use client";

import { NavLink, resolveNavLinkState } from "@/components/layout/nav-link";
import { type MenuItem, type MenuLink } from "@/config/menu";
import { useBrowserPathnameState } from "@/hooks/use-browser-pathname-state";
import { cn } from "@/lib/utils";
import { useLocale, useTranslations } from "next-intl";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";

type SiteNavigationMenuProps = {
  items: MenuItem[];
  className?: string;
};

export function SiteNavigationMenu({ items, className }: SiteNavigationMenuProps) {
  const locale = useLocale();
  const tNav = useTranslations("layout.navigation.items");
  const { pathname } = useBrowserPathnameState();

  function isCurrentGroup(item: Extract<MenuItem, { items: MenuLink[] }>) {
    return item.items.some(function matchesGroupChild(subItem) {
      return resolveNavLinkState({
        href: subItem.href,
        locale,
        pathname,
        matchNested: subItem.matchNested,
      }).isCurrent;
    });
  }

  return (
    <NavigationMenu className="max-w-none flex-none">
      <NavigationMenuList className={className}>
        {items.map((item) => {
          if ("items" in item) {
            return (
              <NavigationMenuItem key={item.labelKey}>
                <NavigationMenuTrigger
                  className={cn(
                    isCurrentGroup(item) && "bg-muted/50 text-foreground hover:bg-muted"
                  )}
                >
                  {tNav(item.labelKey)}
                </NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="flex w-max flex-col gap-1">
                    {item.items.map((subItem) => (
                      <li key={subItem.href}>
                        <NavigationMenuLink
                          render={<NavLink href={subItem.href} matchNested={subItem.matchNested} />}
                          closeOnClick={true}
                          className="data-current:bg-muted/50 data-current:text-foreground data-current:hover:bg-muted"
                        >
                          {subItem.icon && <subItem.icon aria-hidden="true" />}
                          {tNav(subItem.labelKey)}
                        </NavigationMenuLink>
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
            );
          }

          return (
            <NavigationMenuItem key={item.href}>
              <NavigationMenuLink
                render={<NavLink href={item.href} matchNested={item.matchNested} />}
                className={cn(
                  navigationMenuTriggerStyle(),
                  "data-current:bg-muted/50 data-current:text-foreground data-current:hover:bg-muted"
                )}
              >
                {item.icon && <item.icon aria-hidden="true" />}
                {tNav(item.labelKey)}
              </NavigationMenuLink>
            </NavigationMenuItem>
          );
        })}
      </NavigationMenuList>
    </NavigationMenu>
  );
}
