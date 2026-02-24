"use client";

import * as React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import { LogOutIcon } from "lucide-react";
import { Button } from "../ui/button";

export type UserAccountMenuViewer = {
  email: string;
  name: string | null;
  verified: boolean;
};

export type UserAccountMenuLabels = {
  account: string;
  home: string;
  dashboard: string;
  emailNotVerified: string;
  emailVerified: string;
  settings: string;
  logout: string;
};

type UserAccountMenuProps = {
  viewer: UserAccountMenuViewer;
  locale: string;
  labels: UserAccountMenuLabels;
  trigger?: "default" | "avatar";
  className?: string;
};

export function UserAccountMenu({ viewer, locale, labels, className }: UserAccountMenuProps) {
  const logoutFormId = React.useId();
  const displayName = getUserDisplayName(viewer);
  const initials = getUserInitials(displayName ?? viewer.email);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant="ghost" size="icon-lg" className="rounded-full">
              <Avatar className={className}>
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          }
        />
        <DropdownMenuContent align="end" className="min-w-48">
          <DropdownMenuGroup>
            <DropdownMenuLabel className="space-y-1">
              <p className="text-foreground truncate text-sm font-medium">
                {displayName ?? viewer.email}
              </p>
              {displayName && (
                <p className="text-muted-foreground truncate text-xs">{viewer.email}</p>
              )}
              {!viewer.verified && (
                <p className="mt-1 truncate text-xs text-amber-600">{labels.emailNotVerified}</p>
              )}
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/" className="w-full cursor-pointer" />}>
            {labels.home}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/dashboard" className="w-full cursor-pointer" />}>
            {labels.dashboard}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" className="w-full cursor-pointer" />}>
            {labels.settings}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
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
      <form id={logoutFormId} action="/api/logout" method="post" className="hidden">
        <input type="hidden" name="redirectTo" value={`/${locale}/login`} />
      </form>
    </>
  );
}

function getUserDisplayName(viewer: UserAccountMenuViewer) {
  const name = viewer.name?.trim();

  return name || null;
}

function getUserInitials(value: string) {
  const normalized = value.trim();

  if (!normalized) {
    return "?";
  }

  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length === 1) {
    return words[0].slice(0, 2).toUpperCase();
  }

  return `${words[0][0] ?? ""}${words[1][0] ?? ""}`.toUpperCase();
}
