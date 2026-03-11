"use client";

import { createContext, useContext } from "react";
import { useTranslations } from "next-intl";
import { LayoutBanners } from "@/components/layout/layout-banners";
import { SkipToContent } from "@/components/layout/skip-to-content";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
} from "@/components/ui/sidebar";
import { AccountProfileProvider } from "@/features/account/account-profile-context";
import type { AccountProfileSnapshot } from "@/features/account/account-profile";
import { type UserAccountMenuLabels } from "@/features/account/user-account-menu";
import { showEmailVerificationBanner } from "@/features/auth/email-verification";
import { EmailVerificationBanner } from "@/features/auth/email-verification-banner";
import { ApplicationMenuTree } from "./application-menu-tree";
import { WorkspaceSwitcher } from "@/features//workspaces/workspace-switcher";

type ApplicationMobileMenuLabels = {
  openAriaLabel: string;
  title: string;
  close: string;
};

type ApplicationLayoutContextValue = {
  user: AccountProfileSnapshot;
  locale: string;
  userMenuLabels: UserAccountMenuLabels;
  mobileMenuLabels: ApplicationMobileMenuLabels;
};

export type ApplicationLayoutLabels = {
  userMenu: UserAccountMenuLabels;
  mobileMenu: ApplicationMobileMenuLabels;
};

type ApplicationLayoutProps = {
  children: React.ReactNode;
  user: AccountProfileSnapshot;
  locale: string;
  labels: ApplicationLayoutLabels;
};

const ApplicationLayoutContext = createContext<ApplicationLayoutContextValue | null>(null);

export function useSidebarContext() {
  const context = useContext(ApplicationLayoutContext);

  if (!context) {
    throw new Error("useSidebarContext must be used within ApplicationLayout.");
  }

  return context;
}

export function ApplicationLayout({ children, user, locale, labels }: ApplicationLayoutProps) {
  const profileProviderKey = `${user.email}:${user.name ?? ""}:${user.avatarUrl ?? ""}:${user.verified ? "1" : "0"}`;
  const renderEmailVerificationBanner = showEmailVerificationBanner(user);
  const t = useTranslations("layout");
  const contentId = "gtdn-app-content";

  return (
    <AccountProfileProvider key={profileProviderKey} initialProfile={user}>
      <ApplicationLayoutContext.Provider
        value={{
          user,
          locale,
          userMenuLabels: labels.userMenu,
          mobileMenuLabels: labels.mobileMenu,
        }}
      >
        <div className="relative isolate [--navbar-height:--spacing(16)]">
          <SkipToContent href={`#${contentId}`}>{t("skipToContent")}</SkipToContent>

          <SidebarProvider>
            <Sidebar collapsible="offcanvas" className="border-sidebar-border border-r">
              <SidebarHeader className="border-sidebar-border border-b p-2">
                <WorkspaceSwitcher />
              </SidebarHeader>
              <SidebarContent>
                <SidebarGroup className="p-2">
                  <SidebarGroupContent>
                    <ApplicationMenuTree aria-label={labels.mobileMenu.title} />
                  </SidebarGroupContent>
                </SidebarGroup>
              </SidebarContent>
              <SidebarRail />
            </Sidebar>

            <SidebarInset id={contentId} className="min-w-0">
              {/* Banners */}
              <LayoutBanners
                banners={[
                  {
                    isVisible: renderEmailVerificationBanner,
                    content: <EmailVerificationBanner />,
                  },
                ]}
              />

              {/* children */}
              {children}
            </SidebarInset>
          </SidebarProvider>
        </div>
      </ApplicationLayoutContext.Provider>
    </AccountProfileProvider>
  );
}
