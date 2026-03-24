import type { AppHref } from "@/i18n/navigation";

export const APP_HOME_PATH = "/app" as const;
export const SIGN_IN_PATH = "/sign-in" as const;
export const SIGN_UP_PATH = "/sign-up" as const;
export const VERIFY_EMAIL_PATH = "/verify-email" as const;
export const ACCOUNT_PATH = "/account" as const;
export const WORKSPACE_PATH_PREFIX = "/w" as const;
export const WORKSPACE_OVERVIEW_PATH = "/w/[workspaceSlug]/overview" as const;
export const WORKSPACE_SETTINGS_PATH = "/w/[workspaceSlug]/settings" as const;
export const WORKSPACE_SETTINGS_MEMBERS_PATH = "/w/[workspaceSlug]/settings/members" as const;

export const DEFAULT_AUTH_REDIRECTS = {
  unauthenticatedTo: SIGN_IN_PATH,
  authenticatedTo: APP_HOME_PATH,
} as const;

export function getWorkspaceRootPath(workspaceSlug: string): string {
  return `${WORKSPACE_PATH_PREFIX}/${workspaceSlug}`;
}

export function getWorkspaceOverviewPath(workspaceSlug: string): string {
  return `${getWorkspaceRootPath(workspaceSlug)}/overview`;
}

export function getWorkspaceSettingsPath(workspaceSlug: string): string {
  return `${getWorkspaceRootPath(workspaceSlug)}/settings`;
}

export function getWorkspaceSettingsMembersPath(workspaceSlug: string): string {
  return `${getWorkspaceSettingsPath(workspaceSlug)}/members`;
}

export function getWorkspaceOverviewHref(workspaceSlug: string): AppHref {
  return {
    pathname: WORKSPACE_OVERVIEW_PATH,
    params: {
      workspaceSlug,
    },
  };
}

export function getWorkspaceSettingsHref(workspaceSlug: string): AppHref {
  return {
    pathname: WORKSPACE_SETTINGS_PATH,
    params: {
      workspaceSlug,
    },
  };
}

export function getWorkspaceSettingsMembersHref(workspaceSlug: string): AppHref {
  return {
    pathname: WORKSPACE_SETTINGS_MEMBERS_PATH,
    params: {
      workspaceSlug,
    },
  };
}
