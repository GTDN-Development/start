"use client";

import * as React from "react";
import { Locale } from "next-intl";
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
import { Skeleton } from "@/components/ui/skeleton";
import type { AccountProfileSnapshot } from "@/features/account/account-profile";
import { getPathname } from "@/i18n/navigation";
import { getUserInitials } from "@/lib/utils";
import { HomeIcon, LogOutIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export type UserAccountMenuViewer = Omit<AccountProfileSnapshot, "avatarUrl"> & {
  avatarUrl?: string | null;
};

export type UserAccountMenuLabels = {
  account: string;
  accountPage: string;
  home: string;
  dashboard: string;
  emailNotVerified: string;
  emailVerified: string;
  logout: string;
};

type UserAccountMenuProps = {
  viewer: UserAccountMenuViewer;
  locale: string;
  labels: UserAccountMenuLabels;
  className?: string;
};

export function UserAccountMenu({ viewer, locale, labels, className }: UserAccountMenuProps) {
  const accountProfile = useOptionalAccountProfile();
  const logoutFormId = React.useId();
  const logoutRedirectTo = getPathname({
    href: "/login",
    locale: locale as Locale,
  });
  const [failedAvatarUrl, setFailedAvatarUrl] = React.useState<string | null>(null);
  const currentViewer = accountProfile?.profile ?? viewer;
  const isAvatarUpdating = accountProfile?.isAvatarUpdating ?? false;
  const displayName = getUserDisplayName(currentViewer);
  const initials = getUserInitials(displayName ?? currentViewer.email);
  const avatarUrl =
    currentViewer.avatarUrl && currentViewer.avatarUrl !== failedAvatarUrl
      ? currentViewer.avatarUrl
      : null;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              size="icon-lg"
              className="rounded-full"
              aria-label={labels.account}
            >
              {isAvatarUpdating ? (
                <span className="inline-flex size-8 items-center justify-center">
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
                    <AvatarFallback>{initials}</AvatarFallback>
                  )}
                </Avatar>
              )}
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="space-y-1">
              <p className="text-foreground truncate text-sm font-medium">
                {displayName ?? currentViewer.email}
              </p>
              {displayName && (
                <p className="text-muted-foreground truncate text-xs">{currentViewer.email}</p>
              )}
              {!currentViewer.verified && (
                <p className="mt-1 truncate text-xs text-amber-600">{labels.emailNotVerified}</p>
              )}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/dashboard" className="w-full cursor-pointer" />}>
            {labels.dashboard}
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
            {labels.home}
            <HomeIcon aria-hidden="true" className="size-4" />
          </DropdownMenuItem>
          <DropdownMenuItem
            className="flex w-full cursor-pointer justify-between text-left"
            nativeButton={true}
            render={<button type="submit" form={logoutFormId} />}
          >
            {labels.logout}
            <LogOutIcon aria-hidden="true" className="size-4" />
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <form id={logoutFormId} action="/api/auth/logout" method="post" className="hidden">
        <input type="hidden" name="redirectTo" value={logoutRedirectTo} />
      </form>
    </>
  );
}

function getUserDisplayName(viewer: UserAccountMenuViewer) {
  const name = viewer.name?.trim();

  return name || null;
}
