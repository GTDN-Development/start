"use client";

import { NavLink } from "@/components/layout/nav-link";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { applicationMenu } from "@/config/navigation";
import { AppHref, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { useSidebarContext } from "./application-layout";
import { resolveSelectedWorkspaceSlug } from "./workspace-routing";

function isAccountRoute(pathname: string) {
  return pathname === "/account" || pathname.startsWith("/account/");
}

function getWorkspaceSegments(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 3 || segments[0] !== "w") {
    return null;
  }

  return {
    scope: segments[2],
    section: segments[3] ?? null,
  };
}

function isWorkspaceRoute(pathname: string) {
  return getWorkspaceSegments(pathname) !== null;
}

function isMenuItemActive(pathname: string, item: (typeof applicationMenu)[number]) {
  if (item.labelKey === "account") {
    return isAccountRoute(pathname);
  }

  if (item.labelKey === "workspace") {
    return isWorkspaceRoute(pathname);
  }

  if (item.labelKey === "app") {
    return pathname === "/app";
  }

  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

function shouldMatchNested(item: (typeof applicationMenu)[number]) {
  return item.labelKey !== "app";
}

function resolveMenuHref(
  item: (typeof applicationMenu)[number],
  selectedWorkspaceSlug: string | null
): AppHref {
  if (item.labelKey === "account") {
    return item.href;
  }

  if (item.labelKey === "app") {
    return item.href;
  }

  if (item.labelKey === "workspace") {
    if (!selectedWorkspaceSlug) {
      return "/app";
    }

    return {
      pathname: "/w/[workspaceSlug]/settings",
      params: {
        workspaceSlug: selectedWorkspaceSlug,
      },
    };
  }

  return item.href;
}

export function ApplicationMenuTree({ className, ...props }: React.ComponentProps<"nav">) {
  const tNav = useTranslations("layout.navigation.items");
  const tWorkspace = useTranslations("pages.workspace");

  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const { activeWorkspaceSlug, workspaces } = useSidebarContext();

  const selectedWorkspaceSlug = resolveSelectedWorkspaceSlug(
    pathname,
    activeWorkspaceSlug,
    workspaces
  );
  const visibleApplicationMenu = applicationMenu.filter((item) => {
    if (item.labelKey !== "workspace") {
      return true;
    }

    return selectedWorkspaceSlug !== null;
  });

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
          const itemLabel =
            item.labelKey === "workspace" ? tWorkspace("title") : tNav(item.labelKey);
          const ItemIcon = item.icon;

          return (
            <SidebarMenuItem key={item.labelKey}>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={itemLabel}
                render={
                  <NavLink
                    href={itemHref}
                    matchNested={shouldMatchNested(item)}
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
