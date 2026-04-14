"use client";

import { createContext, useContext } from "react";
import { AccountProfileProvider } from "@/features/account/account-profile-context";
import type { AccountProfileSnapshot } from "@/features/account/account-profile-types";
import { type UserAccountMenuLabels } from "@/features/account/user-account-menu";
import { type AppHref } from "@/i18n/navigation";
import { ApplicationAuthSync } from "./application-auth-sync";

type ApplicationMobileMenuLabels = {
  openAriaLabel: string;
  title: string;
  close: string;
};

type ApplicationRootContextValue = {
  user: AccountProfileSnapshot;
  userMenuLabels: UserAccountMenuLabels;
  mobileMenuLabels: ApplicationMobileMenuLabels;
  applicationEntryHref: AppHref;
};

export type ApplicationRootLabels = {
  userMenu: UserAccountMenuLabels;
  mobileMenu: ApplicationMobileMenuLabels;
};

type ApplicationRootProps = {
  children: React.ReactNode;
  user: AccountProfileSnapshot;
  applicationEntryHref: AppHref;
  labels: ApplicationRootLabels;
};

const ApplicationRootContext = createContext<ApplicationRootContextValue | null>(null);

export function useApplicationRootContext() {
  const applicationLayoutContext = useContext(ApplicationRootContext);

  if (!applicationLayoutContext) {
    throw new Error("useApplicationRootContext must be used within ApplicationRoot.");
  }

  return applicationLayoutContext;
}

export function ApplicationRoot({
  children,
  user,
  applicationEntryHref,
  labels,
}: ApplicationRootProps) {
  const profileProviderKey = `${user.email}:${user.name ?? ""}:${user.avatarUrl ?? ""}`;

  return (
    <AccountProfileProvider key={profileProviderKey} initialProfile={user}>
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
    </AccountProfileProvider>
  );
}
