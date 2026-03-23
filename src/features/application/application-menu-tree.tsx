"use client";

import { NavLink } from "@/components/layout/nav-link";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  personalApplicationMenu,
  workspaceApplicationMenu,
  type ApplicationMenuLink,
} from "@/config/navigation";
import { AppHref, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useSidebarContext } from "./application-layout";
import { getWorkspaceSlugFromPathname, resolveApplicationScope } from "./application-scope";
import { resolveSelectedWorkspaceSlug } from "./workspace-routing";

function isAccountRoute(pathname: string) {
  return pathname === "/account" || pathname.startsWith("/account/");
}

function isMenuItemActive(pathname: string, item: ApplicationMenuLink) {
  const pathnameWorkspaceSlug = getWorkspaceSlugFromPathname(pathname);
  const workspaceBasePath = pathnameWorkspaceSlug ? `/w/${pathnameWorkspaceSlug}` : null;

  switch (item.labelKey) {
    case "account":
      return isAccountRoute(pathname);
    case "home":
      return pathname === "/app";
    case "overview":
      if (!workspaceBasePath) {
        return false;
      }

      return pathname === workspaceBasePath || pathname === `${workspaceBasePath}/overview`;
    case "settings":
      if (!workspaceBasePath) {
        return false;
      }

      return (
        pathname === `${workspaceBasePath}/settings` ||
        pathname.startsWith(`${workspaceBasePath}/settings/`)
      );
  }
}

function resolveMenuHref(item: ApplicationMenuLink, selectedWorkspaceSlug: string | null): AppHref {
  if (item.labelKey !== "overview" && item.labelKey !== "settings") {
    return item.href;
  }

  if (!selectedWorkspaceSlug) {
    return "/app";
  }

  if (item.labelKey === "overview") {
    return {
      pathname: "/w/[workspaceSlug]/overview",
      params: {
        workspaceSlug: selectedWorkspaceSlug,
      },
    };
  }

  return {
    pathname: "/w/[workspaceSlug]/settings",
    params: {
      workspaceSlug: selectedWorkspaceSlug,
    },
  };
}

export function ApplicationMenuTree({ className, ...props }: React.ComponentProps<"nav">) {
  const tNav = useTranslations("layout.navigation.items");

  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { activeWorkspaceSlug, workspaces } = useSidebarContext();
  const applicationScope = resolveApplicationScope(pathname);

  const selectedWorkspaceSlug = resolveSelectedWorkspaceSlug(
    pathname,
    activeWorkspaceSlug,
    workspaces
  );
  const visibleApplicationMenu =
    applicationScope === "workspace" && selectedWorkspaceSlug
      ? workspaceApplicationMenu
      : personalApplicationMenu;

  function handleItemClick() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <nav {...props} className={cn(className)}>
      <SidebarMenu className="gap-1">
        {visibleApplicationMenu.map((item) => {
          const isActive = isMenuItemActive(pathname, item);
          const itemHref = resolveMenuHref(item, selectedWorkspaceSlug);
          const itemLabel = tNav(item.labelKey);
          const ItemIcon = item.icon;

          return (
            <SidebarMenuItem key={item.labelKey}>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={itemLabel}
                render={
                  <NavLink
                    href={itemHref}
                    matchNested={"matchNested" in item && item.matchNested === true}
                    onClick={handleItemClick}
                  />
                }
                className="text-sidebar-foreground/80 data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-[current=true]:bg-sidebar-accent data-[current=true]:text-sidebar-accent-foreground"
              >
                <ItemIcon aria-hidden="true" />
                {itemLabel}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
