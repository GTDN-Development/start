"use client";

import { NavLink } from "@/components/layout/nav-link";
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
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

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

              {renderAccountChildren && (
                <SidebarMenuSub>
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
                          accountRoute && "data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
                        )}
                      >
                        {tAccountNav(accountItem.labelKey)}
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
