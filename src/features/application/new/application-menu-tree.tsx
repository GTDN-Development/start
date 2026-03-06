"use client";

import { NavLink } from "@/components/layout/nav-link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { applicationMenu } from "@/config/menu";
import { AppPathname, usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type AccountSettingsMenuItem = {
  href: "/account/settings/general" | "/account/settings/security";
  labelKey: "general" | "security";
};

const accountSettingsMenu: AccountSettingsMenuItem[] = [
  { href: "/account/settings/general", labelKey: "general" },
  { href: "/account/settings/security", labelKey: "security" },
];

function isAccountRoute(pathname: string) {
  return pathname === "/account" || pathname.startsWith("/account/");
}

type WorkspaceSettingsMenuItem = {
  href: "/w/workspace/settings/general" | "/w/workspace/settings/members";
  labelKey: "general" | "members";
};

const workspaceSettingsMenu: WorkspaceSettingsMenuItem[] = [
  { href: "/w/workspace/settings/general", labelKey: "general" },
  { href: "/w/workspace/settings/members", labelKey: "members" },
];

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

function getSectionState(pathname: string, href: AppPathname) {
  if (href === "/account/settings/general") {
    return isAccountRoute(pathname);
  }

  return isWorkspaceSettingsRoute(pathname);
}

function isAccountSubItemActive(pathname: string, href: AccountSettingsMenuItem["href"]) {
  if (href === "/account/settings/general") {
    return pathname === "/account/settings/general" || pathname === "/account";
  }

  if (href === "/account/settings/security") {
    return pathname === "/account/settings/security" || pathname === "/account/security";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function isWorkspaceSubItemActive(pathname: string, href: WorkspaceSettingsMenuItem["href"]) {
  const workspacePath = getWorkspaceSegments(pathname);

  if (workspacePath?.scope !== "settings") {
    return false;
  }

  return workspacePath.section === href.split("/").at(-1);
}

export function ApplicationMenuTree({ className, ...props }: React.ComponentProps<"nav">) {
  const tNav = useTranslations("layout.navigation.items");
  const tAccountNav = useTranslations("pages.account.nav");
  const tWorkspaceNav = useTranslations("pages.workspace.nav");
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const workspaceSettingsRoute = isWorkspaceSettingsRoute(pathname);
  const accountRoute = isAccountRoute(pathname);
  const [isWorkspaceSectionOpen, setIsWorkspaceSectionOpen] = useState(workspaceSettingsRoute);
  const [isAccountSectionOpen, setIsAccountSectionOpen] = useState(accountRoute);

  useEffect(() => {
    if (!workspaceSettingsRoute) {
      return;
    }

    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        setIsWorkspaceSectionOpen(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [workspaceSettingsRoute]);

  useEffect(() => {
    if (!accountRoute) {
      return;
    }

    let isMounted = true;

    Promise.resolve().then(() => {
      if (isMounted) {
        setIsAccountSectionOpen(true);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [accountRoute]);

  function handleItemClick() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  function renderSection(item: (typeof applicationMenu)[number]) {
    const isAccountSection = item.href === "/account/settings/general";
    const subItems = isAccountSection ? accountSettingsMenu : workspaceSettingsMenu;
    const isOpen = isAccountSection ? isAccountSectionOpen : isWorkspaceSectionOpen;
    const setIsOpen = isAccountSection ? setIsAccountSectionOpen : setIsWorkspaceSectionOpen;
    const sectionActive = getSectionState(pathname, item.href);

    return (
      <Collapsible
        key={item.href}
        open={isOpen}
        onOpenChange={setIsOpen}
        className="group/collapsible"
      >
        <SidebarMenuItem>
          <SidebarMenuButton
            isActive={sectionActive}
            tooltip={tNav(item.labelKey)}
            render={<CollapsibleTrigger aria-label={tNav(item.labelKey)} />}
            className="text-sidebar-foreground/80 data-[current=true]:bg-sidebar-accent data-[current=true]:text-sidebar-accent-foreground"
          >
            {tNav(item.labelKey)}
            <ChevronRightIcon
              aria-hidden="true"
              className={cn("ml-auto", isOpen ? "translate-y-px rotate-90" : "-translate-y-px rotate-0")}
            />
          </SidebarMenuButton>
          <CollapsibleContent>
            <SidebarMenuSub className="pt-1">
              {subItems.map((subItem) => (
                <SidebarMenuSubItem key={subItem.href}>
                  <SidebarMenuSubButton
                    isActive={
                      isAccountSection
                        ? isAccountSubItemActive(
                            pathname,
                            subItem.href as AccountSettingsMenuItem["href"]
                          )
                        : isWorkspaceSubItemActive(
                            pathname,
                            subItem.href as WorkspaceSettingsMenuItem["href"]
                          )
                    }
                    render={<NavLink href={subItem.href} matchNested={false} onClick={handleItemClick} />}
                    className={cn(
                      "text-sidebar-foreground/80 hover:text-sidebar-accent-foreground",
                      sectionActive &&
                        "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
                    )}
                  >
                    {isAccountSection ? tAccountNav(subItem.labelKey) : tWorkspaceNav(subItem.labelKey)}
                  </SidebarMenuSubButton>
                </SidebarMenuSubItem>
              ))}
            </SidebarMenuSub>
          </CollapsibleContent>
        </SidebarMenuItem>
      </Collapsible>
    );
  }

  return (
    <nav {...props} className={cn(className)}>
      <SidebarMenu className="gap-1">
        {applicationMenu.map((item) => {
          if (item.href === "/w/workspace/settings/general" || item.href === "/account/settings/general") {
            return renderSection(item);
          }

          return (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                tooltip={tNav(item.labelKey)}
                render={
                  <NavLink
                    href={item.href}
                    matchNested={item.labelKey !== "overview"}
                    onClick={handleItemClick}
                  />
                }
                className="text-sidebar-foreground/80 data-[current=true]:bg-sidebar-accent data-[current=true]:text-sidebar-accent-foreground"
              >
                {tNav(item.labelKey)}
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
