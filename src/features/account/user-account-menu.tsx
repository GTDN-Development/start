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
import { Link, type LinkHref } from "@/components/ui/link";
import { Skeleton } from "@/components/ui/skeleton";
import type { AuthUser } from "@/features/auth/auth-contract";
import { useSignOut } from "@/features/auth/use-sign-out";
import { getAvatarColorClass, getUserInitials } from "@/lib/app-utils";
import { GlobeIcon, LogOutIcon } from "lucide-react";

export type UserAccountMenuViewer = Pick<AuthUser, "id" | "email" | "name" | "verified" | "avatarUrl">;

export type UserAccountMenuLabels = {
  account: string;
  accountPage: string;
  personalHome: string;
  website: string;
  signOut: string;
};

type UserAccountMenuProps = {
  viewer: UserAccountMenuViewer;
  labels: UserAccountMenuLabels;
  appHref?: LinkHref;
  className?: string;
};

export function UserAccountMenu({
  viewer,
  labels,
  appHref = "/app",
  className,
}: UserAccountMenuProps) {
  const accountProfile = useOptionalAccountProfile();
  const { handleSignOut, isPending: isSignOutPending } = useSignOut();

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
    <DropdownMenu>
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
        <DropdownMenuItem render={<Link href={appHref} className="w-full cursor-pointer" />}>
          {labels.personalHome}
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/account" className="w-full cursor-pointer" />}>
          {labels.accountPage}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          render={
            <Link href="/" className="flex w-full cursor-pointer justify-between text-left" />
          }
        >
          {labels.website}
          <GlobeIcon aria-hidden="true" className="size-4" />
        </DropdownMenuItem>
        <DropdownMenuItem
          disabled={isSignOutPending}
          className="justify-between"
          onClick={handleSignOut}
        >
          {labels.signOut}
          <LogOutIcon aria-hidden="true" className="size-4" />
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function getUserDisplayName(viewer: UserAccountMenuViewer) {
  const name = viewer.name?.trim();

  return name || null;
}
