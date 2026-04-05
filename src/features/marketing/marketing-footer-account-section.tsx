"use client";

import { NavLink } from "@/components/layout/nav-link";
import type { LinkHref } from "@/components/ui/link";
import { useSignOut } from "@/features/auth/use-sign-out";
import type { UserAccountMenuViewer } from "@/features/account/user-account-menu";

type MarketingFooterAccountSectionProps = {
  viewer: UserAccountMenuViewer | null;
  applicationEntryHref: LinkHref;
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
              <NavLink
                href={applicationEntryHref}
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {labels.home}
              </NavLink>
            </li>
            <li>
              <NavLink
                href="/account"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {labels.myAccount}
              </NavLink>
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
              <NavLink
                href="/sign-in"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {labels.signIn}
              </NavLink>
            </li>
            <li>
              <NavLink
                href="/sign-up"
                className="text-muted-foreground hover:text-foreground text-sm transition-colors"
              >
                {labels.signUp}
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </div>
  );
}
