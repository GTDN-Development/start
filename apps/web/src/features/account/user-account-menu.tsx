"use client";

import { useState } from "react";
import { useOptionalAccountProfile } from "@/features/account/account-profile-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "@/components/ui/link";
import { ACCOUNT_PATH } from "@/config/routes";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuthUser } from "@/features/auth/auth-types";
import { useSignOut } from "@/features/auth/use-sign-out";
import { useBrowserPathnameState } from "@/hooks/use-browser-pathname-state";
import { type AppHref } from "@/i18n/navigation";
import { getAvatarColorClass, getUserInitials } from "@/lib/app-utils";
import { GlobeIcon, LayoutDashboardIcon, LogOutIcon, UserIcon } from "lucide-react";

export type UserAccountMenuViewer = Pick<AuthUser, "id" | "email" | "name" | "avatarUrl">;

export type UserAccountMenuLabels = {
  account: string;
  accountPage: string;
  applicationEntry: string;
  website: string;
  signOut: string;
};

type UserAccountMenuProps = {
  viewer: UserAccountMenuViewer;
  labels: UserAccountMenuLabels;
  applicationEntryHref: AppHref;
  className?: string;
};

export function UserAccountMenu({
  viewer,
  labels,
  applicationEntryHref,
  className,
}: UserAccountMenuProps) {
  const accountProfile = useOptionalAccountProfile();
  const { handleSignOut, isPending: isSignOutPending } = useSignOut();
  const { navigationId } = useBrowserPathnameState();
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);

  const currentViewer = accountProfile?.profile ?? viewer;
  const isAvatarUpdating = accountProfile?.isAvatarUpdating ?? false;
  const displayName = getUserDisplayName(currentViewer);
  const initials = getUserInitials(displayName ?? currentViewer.email);
  const avatarColorClass = getAvatarColorClass(currentViewer.id);

  const avatarUrl =
    currentViewer.avatarUrl && currentViewer.avatarUrl !== failedAvatarUrl
      ? currentViewer.avatarUrl
      : null;

  return (
    <DropdownMenu key={navigationId}>
      <DropdownMenuTrigger
        className="hover:bg-muted/50 inline-flex rounded-full p-0"
        aria-label={labels.account}
      >
        {isAvatarUpdating ? (
          <span className="inline-flex size-8 shrink-0 items-center justify-center">
            <Skeleton className="size-8 rounded-full" />
          </span>
        ) : (
          <Avatar className={className}>
            {avatarUrl ? (
              <AvatarImage src={avatarUrl} alt="" onError={() => setFailedAvatarUrl(avatarUrl)} />
            ) : (
              <AvatarFallback className={avatarColorClass}>{initials}</AvatarFallback>
            )}
          </Avatar>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-56">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-start gap-2 py-2">
            {isAvatarUpdating ? (
              <span className="inline-flex size-8 shrink-0 items-center justify-center">
                <Skeleton className="size-8 rounded-full" />
              </span>
            ) : (
              <Avatar className={className}>
                {avatarUrl ? (
                  <AvatarImage
                    src={avatarUrl}
                    alt=""
                    onError={() => setFailedAvatarUrl(avatarUrl)}
                  />
                ) : (
                  <AvatarFallback className={avatarColorClass}>{initials}</AvatarFallback>
                )}
              </Avatar>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-foreground truncate text-sm font-medium">
                {displayName ?? currentViewer.email}
              </p>
              {displayName && (
                <p className="text-muted-foreground truncate text-xs">{currentViewer.email}</p>
              )}
            </div>
          </DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href={applicationEntryHref} />}>
          <LayoutDashboardIcon aria-hidden="true" />
          {labels.applicationEntry}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href={ACCOUNT_PATH} />}>
          <UserIcon aria-hidden="true" />
          {labels.accountPage}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem render={<Link href="/" />}>
          <GlobeIcon aria-hidden="true" />
          {labels.website}
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isSignOutPending} onClick={handleSignOut}>
          <LogOutIcon aria-hidden="true" />
          {labels.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getUserDisplayName(viewer: UserAccountMenuViewer) {
  const name = viewer.name?.trim();

  return name || null;
}
