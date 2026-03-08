import type { InnerSidebarNavItem } from "./inner-sidebar-layout";

type ApplicationInnerSidebarMenu = {
  title: string;
  items: InnerSidebarNavItem[];
};

type AccountInnerSidebarLabels = {
  title: string;
  general: string;
  security: string;
};

type WorkspaceSettingsInnerSidebarLabels = {
  title: string;
  general: string;
  members: string;
};

export function createAccountInnerSidebarMenu(
  labels: AccountInnerSidebarLabels
): ApplicationInnerSidebarMenu {
  return {
    title: labels.title,
    items: [
      {
        href: "/account",
        label: labels.general,
        icon: "user",
      },
      {
        href: "/account/security",
        label: labels.security,
        icon: "shield",
        matchNested: true,
      },
    ],
  };
}

export function createWorkspaceSettingsInnerSidebarMenu(
  labels: WorkspaceSettingsInnerSidebarLabels
): ApplicationInnerSidebarMenu {
  return {
    title: labels.title,
    items: [
      {
        href: "/w/workspace/settings",
        label: labels.general,
        icon: "sliders",
      },
      {
        href: "/w/workspace/settings/members",
        label: labels.members,
        icon: "users",
      },
    ],
  };
}
