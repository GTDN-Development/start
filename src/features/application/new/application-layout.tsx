"use client";

import clsx from "clsx";
import { createContext, useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { LayoutBanners } from "@/components/layout/layout-banners";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { Container } from "@/components/ui/container";
import { AccountProfileProvider } from "@/features/account/account-profile-context";
import type { AccountProfileSnapshot } from "@/features/account/account-profile";
import { type UserAccountMenuLabels } from "@/features/account/user-account-menu";
import { showEmailVerificationBanner } from "@/features/auth/email-verification";
import { EmailVerificationBanner } from "@/features/auth/email-verification-banner";
import { ApplicationMenuTree } from "./application-menu-tree";
import { WorkspaceSwitcher } from "./workspace-switcher";

type ApplicationMobileMenuLabels = {
  openAriaLabel: string;
  title: string;
  close: string;
};

type SidebarContextValue = {
  isSidebarOpen: boolean;
  setIsSidebarOpen: (isSidebarOpen: boolean) => void;
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

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function useSidebarContext() {
  const context = useContext(SidebarContext);

  if (!context) {
    throw new Error("useSidebarContext must be used within ApplicationLayout.");
  }

  return context;
}

export function ApplicationLayout({ children, user, locale, labels }: ApplicationLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const profileProviderKey = `${user.email}:${user.name ?? ""}:${user.avatarUrl ?? ""}:${user.verified ? "1" : "0"}`;
  const renderEmailVerificationBanner = showEmailVerificationBanner(user);
  const t = useTranslations("layout");
  const contentId = "gtdn-app-content";

  return (
    <AccountProfileProvider key={profileProviderKey} initialProfile={user}>
      <SidebarContext.Provider
        value={{
          isSidebarOpen,
          setIsSidebarOpen,
          user,
          locale,
          userMenuLabels: labels.userMenu,
          mobileMenuLabels: labels.mobileMenu,
        }}
      >
        <div className="relative isolate">
          <SkipToContent href={`#${contentId}`}>{t("skipToContent")}</SkipToContent>

          <LayoutBanners
            banners={[
              {
                isVisible: renderEmailVerificationBanner,
                content: <EmailVerificationBanner />,
              },
            ]}
          />

          <div
            className={clsx(
              "relative isolate [--navbar-height:--spacing(16)]",
              isSidebarOpen && "lg:grid lg:grid-cols-[auto_1fr]"
            )}
          >
            <aside
              className={clsx(
                "bg-sidebar sticky top-0 left-0 hidden h-screen w-72 overflow-y-auto border-r lg:block",
                !isSidebarOpen && "lg:hidden"
              )}
            >
              <div className="bg-sidebar sticky top-0 border-b">
                <Container className="flex gap-3 py-3.5">
                  <WorkspaceSwitcher />
                </Container>
              </div>
              <Container className="pt-4 pb-16">
                <ApplicationMenuTree aria-label={labels.mobileMenu.title} />
              </Container>
            </aside>

            <div id={contentId} className="min-w-0">
              {children}
            </div>
          </div>
        </div>
      </SidebarContext.Provider>
    </AccountProfileProvider>
  );
}
