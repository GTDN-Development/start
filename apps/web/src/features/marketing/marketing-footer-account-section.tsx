"use client";

import { useSignOut } from "@/features/auth/use-sign-out";
import type { UserAccountMenuViewer } from "@/features/account/user-account-menu";
import { type AppHref } from "@/i18n/navigation";
import { Locale } from "next-intl";
import { LocalizedNavLink } from "@/components/layout/localized-nav-link";

type MarketingFooterAccountSectionProps = {
  viewer: UserAccountMenuViewer | null;
  applicationEntryHref: AppHref;
  locale: Locale;
  labels: {
    heading: string;
    signedInAs: string;
    home: string;
    myAccount: string;
    signIn: string;
    signUp: string;
    signOut: string;
  };
};

export function MarketingFooterAccountSection({
  viewer,
  applicationEntryHref,
  locale,
  labels,
}: MarketingFooterAccountSectionProps) {
  const { handleSignOut, isPending: isSignOutPending } = useSignOut();
  const viewerName = viewer?.name?.trim() || null;

  return (
    <div className="flex flex-col items-start justify-start gap-7">
      <p className="font-heading text-sm font-semibold">{labels.heading}</p>
      {viewer && (
        <div className="space-y-1">
          <p className="text-muted-foreground text-xs">{labels.signedInAs}</p>
          <p className="max-w-full truncate text-sm font-medium">{viewerName ?? viewer.email}</p>
          {viewerName && (
            <p className="text-muted-foreground max-w-full truncate text-xs">{viewer.email}</p>
          )}
        </div>
      )}
      <ul className="flex flex-col gap-2">
        {viewer ? (
          <>
            <li>
              <LocalizedNavLink
                href={applicationEntryHref}
                locale={locale}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {labels.home}
              </LocalizedNavLink>
            </li>
            <li>
              <LocalizedNavLink
                href="/account"
                locale={locale}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {labels.myAccount}
              </LocalizedNavLink>
            </li>
            <li>
              <button
                type="button"
                disabled={isSignOutPending}
                onClick={handleSignOut}
                className="text-muted-foreground hover:text-foreground cursor-pointer appearance-none bg-transparent p-0 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              >
                {labels.signOut}
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <LocalizedNavLink
                href="/sign-in"
                locale={locale}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {labels.signIn}
              </LocalizedNavLink>
            </li>
            <li>
              <LocalizedNavLink
                href="/sign-up"
                locale={locale}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {labels.signUp}
              </LocalizedNavLink>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
