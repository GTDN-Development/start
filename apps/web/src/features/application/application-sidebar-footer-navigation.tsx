"use client";

import { Fragment } from "react";
import { CookieIcon } from "lucide-react";
import { NavLink } from "@/components/layout/nav-link";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { isCookieConsentEnabled } from "@/config/cookie-consent";
import { applicationSidebarFooterMenu } from "@/config/menu";
import { CookieSettingsTrigger } from "@/features/cookies/cookie-settings-trigger";
import { usePathname } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";

function isFooterItemActive(pathname: string, href: string, matchNested?: boolean) {
  if (!matchNested) {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ApplicationSidebarFooterNavigation({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  const tNav = useTranslations("layout.navigation.items");
  const tFooter = useTranslations("layout.footer");
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();
  const cookieConsentEnabled = isCookieConsentEnabled();

  function handleItemClick() {
    if (isMobile) {
      setOpenMobile(false);
    }
  }

  return (
    <nav {...props} className={cn(className)}>
      <SidebarMenu className="gap-1">
        {applicationSidebarFooterMenu.map((item) => {
          const itemLabel = tNav(item.labelKey);
          const ItemIcon = item.icon;
          const shouldRenderCookieSettingsAfterItem =
            cookieConsentEnabled && item.labelKey === "myAccount";

          return (
            <Fragment key={item.labelKey}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={isFooterItemActive(pathname, item.href, item.matchNested)}
                  tooltip={itemLabel}
                  render={
                    <NavLink
                      href={item.href}
                      matchNested={item.matchNested === true}
                      onClick={handleItemClick}
                    />
                  }
                  className="text-sidebar-foreground/80 data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-[current=true]:bg-sidebar-accent data-[current=true]:text-sidebar-accent-foreground"
                >
                  <ItemIcon aria-hidden="true" />
                  {itemLabel}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {shouldRenderCookieSettingsAfterItem && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={tFooter("cookieSettings")}
                    render={<CookieSettingsTrigger type="button" onClick={handleItemClick} />}
                    className="text-sidebar-foreground/80 data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground data-[current=true]:bg-sidebar-accent data-[current=true]:text-sidebar-accent-foreground"
                  >
                    <CookieIcon aria-hidden="true" />
                    {tFooter("cookieSettings")}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </Fragment>
          );
        })}
      </SidebarMenu>
    </nav>
  );
}
