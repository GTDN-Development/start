"use client";

import { useTranslations } from "next-intl";
import { LogoStart } from "@/components/brand/logo-start";
import { Link } from "@/components/ui/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { ApplicationMenuTree } from "./application-menu-tree";
import { useApplicationRootContext } from "./application-root";
import { ApplicationSidebarFooterNavigation } from "./application-sidebar-footer-navigation";
import { ApplicationSidebarSignOut } from "./application-sidebar-sign-out";
import { ScopeSwitcher } from "./scope-switcher";

export function ApplicationSidebar() {
  const t = useTranslations("layout");
  const { applicationEntryHref, mobileMenuLabels } = useApplicationRootContext();

  return (
    <Sidebar collapsible="offcanvas">
      <SidebarHeader>
        <div className="pt-3.5 pl-2.5 lg:pb-2.5">
          <Link
            href={applicationEntryHref}
            aria-label={t("header.homeAriaLabel")}
            className="inline-flex w-fit"
          >
            <LogoStart aria-hidden="true" className="w-18" />
          </Link>
        </div>

        <div className="max-w-full lg:hidden">
          <ScopeSwitcher />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <ApplicationMenuTree aria-label={mobileMenuLabels.title} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarSeparator />
        <ApplicationSidebarFooterNavigation />
        <ApplicationSidebarSignOut />
      </SidebarFooter>
    </Sidebar>
  );
}
