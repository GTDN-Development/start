"use client";

import { createContext, useContext } from "react";
import { type LinkHref } from "@/components/ui/link";
import { AccountProfileProvider } from "@/features/account/account-profile-context";
import type { AccountProfileSnapshot } from "@/features/account/account-profile-types";
import { type UserAccountMenuLabels } from "@/features/account/user-account-menu";
import { ApplicationAuthSync } from "./application-auth-sync";
import {
  WorkspaceNavigationProvider,
  useWorkspaceNavigation,
} from "@/features/workspaces/workspace-navigation-context";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-navigation-types";

type ApplicationMobileMenuLabels = {
  openAriaLabel: string;
  title: string;
  close: string;
};

type ApplicationRootContextValue = {
  user: AccountProfileSnapshot;
  userMenuLabels: UserAccountMenuLabels;
  mobileMenuLabels: ApplicationMobileMenuLabels;
  applicationEntryHref: LinkHref;
};

export type ApplicationRootLabels = {
  userMenu: UserAccountMenuLabels;
  mobileMenu: ApplicationMobileMenuLabels;
};

type ApplicationRootProps = {
  children: React.ReactNode;
  user: AccountProfileSnapshot;
  workspaces: WorkspaceNavigationItem[];
  activeWorkspaceSlug: string | null;
  applicationEntryHref: LinkHref;
  labels: ApplicationRootLabels;
};

const ApplicationRootContext = createContext<ApplicationRootContextValue | null>(null);

export function useSidebarContext() {
  const applicationLayoutContext = useContext(ApplicationRootContext);
  const workspaceNavigationContext = useWorkspaceNavigation();

  if (!applicationLayoutContext) {
    throw new Error("useSidebarContext must be used within ApplicationRoot.");
  }

  return {
    ...applicationLayoutContext,
    ...workspaceNavigationContext,
  };
}

export function ApplicationRoot({
  children,
  user,
  workspaces,
  activeWorkspaceSlug,
  applicationEntryHref,
  labels,
}: ApplicationRootProps) {
  const profileProviderKey = `${user.email}:${user.name ?? ""}:${user.avatarUrl ?? ""}`;
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

  return (
    <AccountProfileProvider key={profileProviderKey} initialProfile={user}>
      <WorkspaceNavigationProvider
        key={workspaceNavigationKey}
        initialWorkspaces={workspaces}
        initialActiveWorkspaceSlug={activeWorkspaceSlug}
      >
        <ApplicationRootContext.Provider
          value={{
            user,
            userMenuLabels: labels.userMenu,
            mobileMenuLabels: labels.mobileMenu,
            applicationEntryHref,
          }}
        >
          <ApplicationAuthSync />
          {children}
        </ApplicationRootContext.Provider>
      </WorkspaceNavigationProvider>
    </AccountProfileProvider>
  );
}
