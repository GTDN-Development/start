import {
  ACCOUNT_PATH,
  WORKSPACE_SETTINGS_MEMBERS_PATH,
  WORKSPACE_SETTINGS_PATH,
} from "@/config/routes";
import type { InnerSidebarNavItem } from "./inner-sidebar-types";

type InnerSidebarItemDefinition<TLabelKey extends string> = Omit<InnerSidebarNavItem, "label"> & {
  labelKey: TLabelKey;
};

type WorkspaceInnerSidebarPathname =
  | typeof WORKSPACE_SETTINGS_PATH
  | typeof WORKSPACE_SETTINGS_MEMBERS_PATH;

type WorkspaceInnerSidebarItemDefinition<TLabelKey extends string> = Omit<
  InnerSidebarItemDefinition<TLabelKey>,
  "href"
> & {
  href: WorkspaceInnerSidebarPathname;
};

export const accountInnerSidebarItems = [
  {
    href: ACCOUNT_PATH,
    labelKey: "nav.profile",
    icon: "user",
  },
  {
    href: "/account/preferences",
    labelKey: "nav.preferences",
    icon: "slidersHorizontal",
  },
  {
    href: "/account/security",
    labelKey: "nav.security",
    icon: "shield",
    matchNested: true,
  },
] as const satisfies ReadonlyArray<
  InnerSidebarItemDefinition<"nav.preferences" | "nav.profile" | "nav.security">
>;

export const workspaceSettingsInnerSidebarItems = [
  {
    href: WORKSPACE_SETTINGS_PATH,
    labelKey: "general",
    icon: "slidersHorizontal",
  },
  {
    href: WORKSPACE_SETTINGS_MEMBERS_PATH,
    labelKey: "members",
    icon: "users",
  },
] as const satisfies ReadonlyArray<WorkspaceInnerSidebarItemDefinition<"general" | "members">>;

export function getWorkspaceSettingsInnerSidebarItems() {
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
