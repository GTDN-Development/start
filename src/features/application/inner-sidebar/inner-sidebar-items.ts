import { ShieldIcon, SlidersHorizontalIcon, UserIcon, UsersIcon } from "lucide-react";
import type { InnerSidebarNavItem } from "./inner-sidebar-layout";

type InnerSidebarItemDefinition<TLabelKey extends string> = Omit<InnerSidebarNavItem, "label"> & {
  labelKey: TLabelKey;
};

type WorkspaceInnerSidebarPathname =
  | "/w/[workspaceSlug]/settings"
  | "/w/[workspaceSlug]/settings/members";

type WorkspaceInnerSidebarItemDefinition<TLabelKey extends string> = Omit<
  InnerSidebarItemDefinition<TLabelKey>,
  "href"
> & {
  href: WorkspaceInnerSidebarPathname;
};

export const accountInnerSidebarItems = [
  {
    href: "/account",
    labelKey: "nav.profile",
    icon: UserIcon,
  },
  {
    href: "/account/preferences",
    labelKey: "nav.general",
    icon: SlidersHorizontalIcon,
  },
  {
    href: "/account/security",
    labelKey: "nav.security",
    icon: ShieldIcon,
    matchNested: true,
  },
] as const satisfies ReadonlyArray<
  InnerSidebarItemDefinition<"nav.general" | "nav.profile" | "nav.security">
>;

export const workspaceSettingsInnerSidebarItems = [
  {
    href: "/w/[workspaceSlug]/settings",
    labelKey: "general",
    icon: SlidersHorizontalIcon,
  },
  {
    href: "/w/[workspaceSlug]/settings/members",
    labelKey: "members",
    icon: UsersIcon,
  },
] as const satisfies ReadonlyArray<WorkspaceInnerSidebarItemDefinition<"general" | "members">>;

export function getWorkspaceSettingsInnerSidebarItems(workspaceKind: "organization" | "personal") {
  if (workspaceKind === "personal") {
    return workspaceSettingsInnerSidebarItems.filter(
      (item) => item.href !== "/w/[workspaceSlug]/settings/members"
    );
  }

  return workspaceSettingsInnerSidebarItems;
}

export function mapInnerSidebarItems<TLabelKey extends string>(
  items: ReadonlyArray<InnerSidebarItemDefinition<TLabelKey>>,
  getLabel: (labelKey: TLabelKey) => string
): InnerSidebarNavItem[] {
  return items.map(({ labelKey, ...item }) => ({
    ...item,
    label: getLabel(labelKey),
  }));
}

export function mapWorkspaceInnerSidebarItems<TLabelKey extends string>(
  items: ReadonlyArray<WorkspaceInnerSidebarItemDefinition<TLabelKey>>,
  workspaceSlug: string,
  getLabel: (labelKey: TLabelKey) => string
): InnerSidebarNavItem[] {
  return items.map(({ labelKey, href, ...item }) => ({
    ...item,
    href: {
      pathname: href,
      params: {
        workspaceSlug,
      },
    },
    activePathnames: [href, ...(item.activePathnames ?? [])],
    label: getLabel(labelKey),
  }));
}
