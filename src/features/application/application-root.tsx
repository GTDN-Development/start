"use client";

import { createContext, useContext } from "react";
import { type LinkHref } from "@/components/ui/link";
import { AUTH_REDIRECTS } from "@/config/auth";
import { AccountProfileProvider } from "@/features/account/account-profile-context";
import type { AccountProfileSnapshot } from "@/features/account/account-profile-types";
import { type UserAccountMenuLabels } from "@/features/account/user-account-menu";
import { useSession } from "@/features/auth/auth-client";
import { useMountEffect } from "@/hooks/use-mount-effect";
import { useRouter } from "@/i18n/navigation";
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
  const sessionSnapshot = useSession();

  if (sessionSnapshot.status === "unauthenticated") {
    return <UnauthenticatedApplicationRedirect />;
  }

  const currentUser =
    sessionSnapshot.status === "authenticated" ? (sessionSnapshot.session?.user ?? user) : user;
  const profileProviderKey = `${currentUser.email}:${currentUser.name ?? ""}:${currentUser.avatarUrl ?? ""}`;
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
    <AccountProfileProvider key={profileProviderKey} initialProfile={currentUser}>
      <WorkspaceNavigationProvider
        key={workspaceNavigationKey}
        initialWorkspaces={workspaces}
        initialActiveWorkspaceSlug={activeWorkspaceSlug}
      >
        <ApplicationRootContext.Provider
          value={{
            user: currentUser,
            userMenuLabels: labels.userMenu,
            mobileMenuLabels: labels.mobileMenu,
            applicationEntryHref,
          }}
        >
          {children}
        </ApplicationRootContext.Provider>
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
