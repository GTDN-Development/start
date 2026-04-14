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
} from "@/config/menu";
import {
  APP_HOME_PATH,
  getWorkspaceOverviewHref,
  getWorkspaceOverviewPath,
  getWorkspaceRootPath,
  getWorkspaceSettingsHref,
  getWorkspaceSettingsPath,
} from "@/config/routes";
import { useOptionalWorkspaceNavigation } from "@/features/workspaces/workspace-navigation-context";
import { AppHref, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { getWorkspaceSlugFromPathname, resolveApplicationScope } from "./application-scope";
import { resolveSelectedWorkspaceSlug } from "./workspace-selection";

function isMenuItemActive(pathname: string, item: ApplicationMenuLink) {
  const pathnameWorkspaceSlug = getWorkspaceSlugFromPathname(pathname);

  switch (item.labelKey) {
    case "home":
      return pathname === APP_HOME_PATH;
    case "overview": {
      if (!pathnameWorkspaceSlug) {
        return false;
      }

      const workspaceBasePath = getWorkspaceRootPath(pathnameWorkspaceSlug);

      return (
        pathname === workspaceBasePath ||
        pathname === getWorkspaceOverviewPath(pathnameWorkspaceSlug)
      );
    }
    case "settings": {
      if (!pathnameWorkspaceSlug) {
        return false;
      }

      const workspaceSettingsPath = getWorkspaceSettingsPath(pathnameWorkspaceSlug);

      return pathname === workspaceSettingsPath || pathname.startsWith(`${workspaceSettingsPath}/`);
    }
  }
}

function resolveMenuHref(item: ApplicationMenuLink, selectedWorkspaceSlug: string | null): AppHref {
  if (item.labelKey !== "overview" && item.labelKey !== "settings") {
    return item.href;
  }

  if (!selectedWorkspaceSlug) {
    return APP_HOME_PATH;
  }

  if (item.labelKey === "overview") {
    return getWorkspaceOverviewHref(selectedWorkspaceSlug);
  }

  return getWorkspaceSettingsHref(selectedWorkspaceSlug);
}

export function ApplicationMenuTree({ className, ...props }: React.ComponentProps<"nav">) {
  const tNav = useTranslations("layout.navigation.items");

  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const workspaceNavigation = useOptionalWorkspaceNavigation();
  const activeWorkspaceSlug = workspaceNavigation?.activeWorkspaceSlug ?? null;
  const workspaces = workspaceNavigation?.workspaces ?? [];
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
