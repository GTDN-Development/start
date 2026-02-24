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
import { cn } from "@/lib/utils";
import { ChevronDownIcon, LayoutDashboardIcon, LogOutIcon, SettingsIcon } from "lucide-react";

export type UserAccountMenuViewer = {
  email: string;
  name: string | null;
  verified: boolean;
};

export type UserAccountMenuLabels = {
  account: string;
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

export function UserAccountMenu({
  viewer,
  locale,
  labels,
  trigger = "default",
  className,
}: UserAccountMenuProps) {
  const logoutFormId = React.useId();
  const displayName = getUserDisplayName(viewer);
  const initials = getUserInitials(displayName ?? viewer.email);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className={cn(
                "hover:bg-muted focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center gap-2 rounded-lg text-sm transition-colors outline-none focus-visible:ring-3",
                trigger === "avatar" ? "size-9 justify-center p-0" : "px-2 py-1.5",
                className
              )}
              aria-label={labels.account}
            />
          }
        >
          <Avatar size="sm">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          {trigger === "default" ? (
            <>
              <span className="max-w-32 truncate font-medium">{displayName ?? viewer.email}</span>
              <ChevronDownIcon aria-hidden="true" className="size-4 opacity-70" />
            </>
          ) : null}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 min-w-56">
          <DropdownMenuGroup>
            <DropdownMenuLabel>
              <p className="truncate text-sm font-medium">{displayName ?? viewer.email}</p>
              {displayName ? (
                <p className="text-muted-foreground truncate text-xs">{viewer.email}</p>
              ) : null}
              <p
                className={cn(
                  "mt-1 truncate text-xs",
                  viewer.verified ? "text-emerald-600" : "text-amber-600"
                )}
              >
                {viewer.verified ? labels.emailVerified : labels.emailNotVerified}
              </p>
            </DropdownMenuLabel>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<Link href="/dashboard" className="w-full cursor-pointer" />}>
            <LayoutDashboardIcon aria-hidden="true" className="size-4" />
            {labels.dashboard}
          </DropdownMenuItem>
          <DropdownMenuItem render={<Link href="/settings" className="w-full cursor-pointer" />}>
            <SettingsIcon aria-hidden="true" className="size-4" />
            {labels.settings}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            variant="destructive"
            nativeButton={true}
            render={
              <button
                type="submit"
                form={logoutFormId}
                className="w-full cursor-pointer text-left"
              />
            }
          >
            <LogOutIcon aria-hidden="true" className="size-4" />
            {labels.logout}
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
