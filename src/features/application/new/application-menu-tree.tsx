"use client";

import { NavLink } from "@/components/layout/nav-link";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar } from "@/components/ui/sidebar";
import { applicationMenu } from "@/config/menu";
import { AppPathname, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import {
  CircleIcon,
  LayoutDashboardIcon,
  SettingsIcon,
  type LucideIcon,
  UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";

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

function isWorkspaceSettingsRoute(pathname: string) {
  const workspacePath = getWorkspaceSegments(pathname);
  return workspacePath?.scope === "settings";
}

function isMenuItemActive(pathname: string, href: AppPathname) {
  if (href === "/account") {
    return isAccountRoute(pathname);
  }

  if (href === "/w/workspace/settings") {
    return isWorkspaceSettingsRoute(pathname);
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function shouldMatchNested(href: AppPathname) {
  return href !== "/w/workspace/overview";
}

function getMainMenuItemIcon(href: AppPathname): LucideIcon {
  if (href === "/w/workspace/overview") {
    return LayoutDashboardIcon;
  }

  if (href === "/w/workspace/settings") {
    return SettingsIcon;
  }

  if (href === "/account") {
    return UserIcon;
  }

  return CircleIcon;
}

export function ApplicationMenuTree({ className, ...props }: React.ComponentProps<"nav">) {
  const tNav = useTranslations("layout.navigation.items");
  const tWorkspace = useTranslations("pages.workspace");
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  function handleItemClick() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <nav {...props} className={cn(className)}>
      <SidebarMenu className="gap-1">
        {applicationMenu.map((item) => {
          const isActive = isMenuItemActive(pathname, item.href);
          const itemLabel = item.labelKey === "workspace" ? tWorkspace("title") : tNav(item.labelKey);
          const ItemIcon = getMainMenuItemIcon(item.href);

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                isActive={isActive}
                tooltip={itemLabel}
                render={
                  <NavLink
                    href={item.href}
                    matchNested={shouldMatchNested(item.href)}
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
