"use client";

import { createContext, useContext } from "react";
import { useLocale } from "next-intl";
import { AUTH_REDIRECTS } from "@/config/auth";
import type { LayoutBannerLabels, LayoutBannerViewModel } from "@/components/layout/layout-banners";
import { AccountProfileProvider } from "@/features/account/account-profile-context";
import type { AccountProfileSnapshot } from "@/features/account/account-profile-types";
import { subscribeToAuthClientEvents } from "@/features/auth/auth-client-events";
import { type UserAccountMenuLabels } from "@/features/account/user-account-menu";
import { getPathname, type AppHref } from "@/i18n/navigation";
import { useMountEffect } from "@/hooks/use-mount-effect";

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
  layoutBanner: LayoutBannerViewModel | null;
  layoutBannerLabels: LayoutBannerLabels;
};

export type ApplicationRootLabels = {
  userMenu: UserAccountMenuLabels;
  mobileMenu: ApplicationMobileMenuLabels;
};

type ApplicationRootProps = {
  children: React.ReactNode;
  user: AccountProfileSnapshot;
  applicationEntryHref: AppHref;
  layoutBanner: LayoutBannerViewModel | null;
  layoutBannerLabels: LayoutBannerLabels;
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

export function useOptionalApplicationRootContext() {
  return useContext(ApplicationRootContext);
}

export function ApplicationRoot({
  children,
  user,
  applicationEntryHref,
  layoutBanner,
  layoutBannerLabels,
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
          layoutBanner,
          layoutBannerLabels,
        }}
      >
        <ApplicationSignOutSync />
        {children}
      </ApplicationRootContext.Provider>
    </AccountProfileProvider>
  );
}

function ApplicationSignOutSync() {
  const locale = useLocale();

  useMountEffect(function mountApplicationSignOutSync() {
    let hasRedirected = false;

    function redirectToSignIn() {
      if (hasRedirected) {
        return;
      }

      hasRedirected = true;

      window.location.assign(
        getPathname({
          href: AUTH_REDIRECTS.unauthenticatedTo,
          locale,
        })
      );
    }

    return subscribeToAuthClientEvents(redirectToSignIn);
  });

  return null;
}
