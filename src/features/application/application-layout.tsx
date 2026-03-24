"use client";

import { createContext, useContext } from "react";
import { useTranslations } from "next-intl";
import { LayoutBanners } from "@/components/layout/layout-banners";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { LogoStart } from "@/components/brand/logo-start";
import { Link } from "@/components/ui/link";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { AUTH_REDIRECTS } from "@/config/auth";
import { AccountProfileProvider } from "@/features/account/account-profile-context";
import type { AccountProfileSnapshot } from "@/features/account/account-profile";
import { type UserAccountMenuLabels } from "@/features/account/user-account-menu";
import { useSession } from "@/features/auth/auth-client";
import { showEmailVerificationBanner } from "@/features/auth/email-verification";
import { EmailVerificationBanner } from "@/features/auth/email-verification-banner";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { useRouter } from "@/i18n/navigation";
import {
  WorkspaceNavigationProvider,
  useWorkspaceNavigation,
} from "@/features/workspaces/workspace-navigation-context";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-types";
import { ApplicationSidebarFooterNavigation } from "./application-sidebar-footer-navigation";
import { ApplicationSidebarSignOut } from "./application-sidebar-sign-out";
import { ApplicationMenuTree } from "./application-menu-tree";
import { ScopeSwitcher } from "./scope-switcher";

type ApplicationMobileMenuLabels = {
  openAriaLabel: string;
  title: string;
  close: string;
};

type ApplicationLayoutContextValue = {
  user: AccountProfileSnapshot;
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
  workspaces: WorkspaceNavigationItem[];
  activeWorkspaceSlug: string | null;
  labels: ApplicationLayoutLabels;
};

const ApplicationLayoutContext = createContext<ApplicationLayoutContextValue | null>(null);

export function useSidebarContext() {
  const applicationLayoutContext = useContext(ApplicationLayoutContext);
  const workspaceNavigationContext = useWorkspaceNavigation();

  if (!applicationLayoutContext) {
    throw new Error("useSidebarContext must be used within ApplicationLayout.");
  }

  return {
    ...applicationLayoutContext,
    ...workspaceNavigationContext,
  };
}

export function ApplicationLayout({
  children,
  user,
  workspaces,
  activeWorkspaceSlug,
  labels,
}: ApplicationLayoutProps) {
  const sessionSnapshot = useSession();
  const t = useTranslations("layout");
  const contentId = "gtdn-app-content";

  if (sessionSnapshot.status === "unauthenticated") {
    return <UnauthenticatedApplicationRedirect />;
  }

  const currentUser =
    sessionSnapshot.status === "authenticated" ? (sessionSnapshot.session?.user ?? user) : user;
  const profileProviderKey = `${currentUser.email}:${currentUser.name ?? ""}:${currentUser.avatarUrl ?? ""}:${currentUser.verified ? "1" : "0"}`;
  const workspaceNavigationKey = `${activeWorkspaceSlug ?? ""}:${workspaces
    .map((workspace) =>
      [
        workspace.id,
        workspace.slug,
        workspace.name,
        workspace.role,
        workspace.avatarUrl ?? "",
        String(workspace.memberCount),
      ].join(":")
    )
    .join("|")}`;

  const renderEmailVerificationBanner = showEmailVerificationBanner(currentUser);

  return (
    <AccountProfileProvider key={profileProviderKey} initialProfile={currentUser}>
      <WorkspaceNavigationProvider
        key={workspaceNavigationKey}
        initialWorkspaces={workspaces}
        initialActiveWorkspaceSlug={activeWorkspaceSlug}
      >
        <ApplicationLayoutContext.Provider
          value={{
            user: currentUser,
            userMenuLabels: labels.userMenu,
            mobileMenuLabels: labels.mobileMenu,
          }}
        >
          <div className="relative isolate [--navbar-height:--spacing(16)]">
            <SkipToContent href={`#${contentId}`}>{t("skipToContent")}</SkipToContent>

            <SidebarProvider>
              <Sidebar collapsible="offcanvas">
                <SidebarHeader>
                  <div className="pt-3.5 pl-2.5 lg:pb-2.5">
                    <Link
                      href="/"
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
                      <ApplicationMenuTree aria-label={labels.mobileMenu.title} />
                    </SidebarGroupContent>
                  </SidebarGroup>
                </SidebarContent>
                <SidebarFooter>
                  <SidebarSeparator />
                  <ApplicationSidebarFooterNavigation />
                  <ApplicationSidebarSignOut />
                </SidebarFooter>
              </Sidebar>

              <SidebarInset id={contentId} className="min-w-0">
                <LayoutBanners
                  banners={[
                    {
                      isVisible: renderEmailVerificationBanner,
                      content: <EmailVerificationBanner />,
                    },
                  ]}
                />

                {children}
              </SidebarInset>
            </SidebarProvider>
          </div>
        </ApplicationLayoutContext.Provider>
      </WorkspaceNavigationProvider>
    </AccountProfileProvider>
  );
}

function UnauthenticatedApplicationRedirect() {
  const router = useRouter();

  useMountEffect(() => {
    router.replace(AUTH_REDIRECTS.unauthenticatedTo);
  });

  return null;
}
