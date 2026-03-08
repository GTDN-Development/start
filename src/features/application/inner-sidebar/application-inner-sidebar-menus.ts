import type { InnerSidebarNavItem } from "./application-inner-sidebar-layout";

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
        activePathnames: ["/account", "/account/settings/general"],
      },
      {
        href: "/account/security",
        label: labels.security,
        matchNested: true,
        activePathnames: ["/account/security", "/account/settings/security"],
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
      },
      {
        href: "/w/workspace/settings/members",
        label: labels.members,
      },
    ],
  };
}
