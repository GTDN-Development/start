"use client";

import { createContext, useContext } from "react";
import { useTranslations } from "next-intl";
import { LayoutBanners } from "@/components/layout/layout-banners";
import { SkipToContent } from "@/components/layout/skip-to-content";
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
import { AccountProfileProvider } from "@/features/account/account-profile-context";
import type { AccountProfileSnapshot } from "@/features/account/account-profile";
import { type UserAccountMenuLabels } from "@/features/account/user-account-menu";
import { useSession } from "@/features/auth/auth-client";
import { showEmailVerificationBanner } from "@/features/auth/email-verification";
import { EmailVerificationBanner } from "@/features/auth/email-verification-banner";
import {
  WorkspaceNavigationProvider,
  useWorkspaceNavigation,
} from "@/features/workspaces/workspace-navigation-context";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-types";
import { ApplicationSidebarSignOut } from "./application-sidebar-sign-out";
import { ApplicationMenuTree } from "./application-menu-tree";
import { WorkspaceSwitcher } from "@/features/workspaces/workspace-switcher";

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
  locale,
  workspaces,
  activeWorkspaceSlug,
  labels,
}: ApplicationLayoutProps) {
  const sessionSnapshot = useSession();
  const currentUser = getCurrentUserSnapshot(user, sessionSnapshot);
  const profileProviderKey = `${currentUser.email}:${currentUser.name ?? ""}:${currentUser.avatarUrl ?? ""}:${currentUser.verified ? "1" : "0"}`;
  const workspaceNavigationKey = `${activeWorkspaceSlug ?? ""}:${workspaces
    .map((workspace) =>
      [
        workspace.id,
        workspace.slug,
        workspace.name,
        workspace.kind,
        workspace.role,
        workspace.avatarUrl ?? "",
        String(workspace.memberCount),
      ].join(":")
    )
    .join("|")}`;

  const renderEmailVerificationBanner = showEmailVerificationBanner(currentUser);
  const t = useTranslations("layout");
  const contentId = "gtdn-app-content";

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
            locale,
            userMenuLabels: labels.userMenu,
            mobileMenuLabels: labels.mobileMenu,
          }}
        >
          <div className="relative isolate [--navbar-height:--spacing(16)]">
            <SkipToContent href={`#${contentId}`}>{t("skipToContent")}</SkipToContent>

            <SidebarProvider>
              <Sidebar collapsible="offcanvas">
                <SidebarHeader>
                  <WorkspaceSwitcher />
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

function getCurrentUserSnapshot(
  fallbackUser: AccountProfileSnapshot,
  sessionSnapshot: ReturnType<typeof useSession>
) {
  const sessionUser =
    sessionSnapshot.status === "authenticated" ? (sessionSnapshot.session?.user ?? null) : null;

  if (!sessionUser) {
    return fallbackUser;
  }

  return {
    email: sessionUser.email,
    name: sessionUser.name,
    verified: sessionUser.verified,
    avatarUrl: sessionUser.avatarUrl,
  } satisfies AccountProfileSnapshot;
}
