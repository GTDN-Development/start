"use client";

import { Fragment } from "react";
import { CookieIcon } from "lucide-react";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { isCookieConsentEnabled } from "@/config/cookie-consent";
import { applicationSidebarFooterMenu } from "@/config/menu";
import { CookieSettingsTrigger } from "@/features/cookies/cookie-settings-trigger";
import { cn } from "@/lib/utils";
import { useTranslations } from "next-intl";
import { ApplicationSidebarNavButton } from "./application-sidebar-nav-button";

export function ApplicationSidebarFooterNavigation({
  className,
  ...props
}: React.ComponentProps<"nav">) {
  const tNav = useTranslations("layout.navigation.items");
  const tFooter = useTranslations("layout.footer");
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
                <ApplicationSidebarNavButton
                  href={item.href}
                  icon={ItemIcon}
                  label={itemLabel}
                  matchNested={item.matchNested === true}
                  onClick={handleItemClick}
                />
              </SidebarMenuItem>

              {shouldRenderCookieSettingsAfterItem && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    tooltip={tFooter("cookieSettings")}
                    render={<CookieSettingsTrigger type="button" onClick={handleItemClick} />}
                    className="text-sidebar-foreground/80"
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
