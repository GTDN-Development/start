"use client";

import { NavLink } from "@/components/layout/nav-link";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { applicationMenu } from "@/config/menu";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { ChevronRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

type AccountSettingsMenuItem = {
  href: "/account" | "/account/security";
  labelKey: "general" | "security";
};

const accountSettingsMenu: AccountSettingsMenuItem[] = [
  { href: "/account", labelKey: "general" },
  { href: "/account/security", labelKey: "security" },
];

function isAccountRoute(pathname: string) {
  return pathname === "/account" || pathname.startsWith("/account/");
}

export function ApplicationMenuTree({ className, ...props }: React.ComponentProps<"nav">) {
  const tNav = useTranslations("layout.navigation.items");
  const tAccountNav = useTranslations("pages.account.nav");
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const accountRoute = isAccountRoute(pathname);
  const [isAccountSectionOpen, setIsAccountSectionOpen] = useState(accountRoute);

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

  return (
    <nav {...props} className={cn(className)}>
      <SidebarMenu>
        {applicationMenu.map((item) => {
          const renderAccountChildren = item.href === "/account";

          if (!renderAccountChildren) {
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  tooltip={tNav(item.labelKey)}
                  render={
                    <NavLink
                      href={item.href}
                      matchNested={item.href !== "/overview"}
                      onClick={handleItemClick}
                    />
                  }
                  className="text-sidebar-foreground/80 data-[current=true]:bg-sidebar-accent data-[current=true]:text-sidebar-accent-foreground"
                >
                  {tNav(item.labelKey)}
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          }

          return (
            <Collapsible
              key={item.href}
              open={isAccountSectionOpen}
              onOpenChange={setIsAccountSectionOpen}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <SidebarMenuButton
                  tooltip={tNav(item.labelKey)}
                  render={
                    <NavLink
                      href={item.href}
                      matchNested={item.href !== "/overview"}
                      onClick={handleItemClick}
                    />
                  }
                  className="text-sidebar-foreground/80 data-[current=true]:bg-sidebar-accent data-[current=true]:text-sidebar-accent-foreground"
                >
                  {tNav(item.labelKey)}
                </SidebarMenuButton>
                <SidebarMenuAction render={<CollapsibleTrigger aria-label={tNav(item.labelKey)} />}>
                  <ChevronRightIcon
                    aria-hidden="true"
                    className={cn(
                      "transition-transform duration-200",
                      isAccountSectionOpen ? "translate-y-px rotate-90" : "-translate-y-px rotate-0"
                    )}
                  />
                </SidebarMenuAction>
                <CollapsibleContent>
                  <SidebarMenuSub className="pt-1">
                    {accountSettingsMenu.map((accountItem) => (
                      <SidebarMenuSubItem key={accountItem.href}>
                        <SidebarMenuSubButton
                          isActive={
                            accountItem.href === "/account"
                              ? pathname === "/account"
                              : pathname === accountItem.href ||
                                pathname.startsWith(`${accountItem.href}/`)
                          }
                          render={
                            <NavLink
                              href={accountItem.href}
                              matchNested={accountItem.href !== "/account"}
                              onClick={handleItemClick}
                            />
                          }
                          className={cn(
                            "text-sidebar-foreground/80 hover:text-sidebar-accent-foreground",
                            accountRoute &&
                              "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
                          )}
                        >
                          {tAccountNav(accountItem.labelKey)}
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
