import type { InnerSidebarNavItem } from "./inner-sidebar-layout";

type InnerSidebarItemDefinition<TLabelKey extends string> = Omit<InnerSidebarNavItem, "label"> & {
  labelKey: TLabelKey;
};

export const accountInnerSidebarItems = [
  {
    href: "/account",
    labelKey: "nav.general",
    icon: "user",
  },
  {
    href: "/account/security",
    labelKey: "nav.security",
    icon: "shield",
    matchNested: true,
  },
] as const satisfies ReadonlyArray<InnerSidebarItemDefinition<"nav.general" | "nav.security">>;

export const workspaceSettingsInnerSidebarItems = [
  {
    href: "/w/workspace/settings",
    labelKey: "general",
    icon: "sliders",
  },
  {
    href: "/w/workspace/settings/members",
    labelKey: "members",
    icon: "users",
  },
] as const satisfies ReadonlyArray<InnerSidebarItemDefinition<"general" | "members">>;

export function mapInnerSidebarItems<TLabelKey extends string>(
  items: ReadonlyArray<InnerSidebarItemDefinition<TLabelKey>>,
  getLabel: (labelKey: TLabelKey) => string
): InnerSidebarNavItem[] {
  return items.map(({ labelKey, ...item }) => ({
    ...item,
    label: getLabel(labelKey),
  }));
}
