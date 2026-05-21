import type { AppHref } from "@/i18n/navigation";

export const APP_HOME_PATH = "/app" as const;
export const SIGN_IN_PATH = "/sign-in" as const;
export const SIGN_UP_PATH = "/sign-up" as const;
export const POST_AUTH_PATH = "/post-auth" as const;
export const FORGOT_PASSWORD_PATH = "/forgot-password" as const;
export const VERIFY_EMAIL_PATH = "/verify-email" as const;
export const VERIFY_EMAIL_COMPLETE_PATH = "/verify-email/complete" as const;
export const RESET_PASSWORD_PATH = "/reset-password" as const;
export const CONFIRM_EMAIL_CHANGE_PATH = "/confirm-email-change" as const;
export const ACCOUNT_PATH = "/account" as const;
export const ACCOUNT_PREFERENCES_PATH = "/account/preferences" as const;
export const ACCOUNT_SECURITY_PATH = "/account/security" as const;
export const INVITE_PATH = "/invite/[token]" as const;
export const INVITE_ACCEPT_PATH = "/invite/[token]/accept" as const;
export const INVITE_START_PATH = "/invite/[token]/start" as const;
export const ORGANIZATION_PATH_PREFIX = "/o" as const;
export const ORGANIZATION_OVERVIEW_PATH = "/o/[organizationSlug]/overview" as const;
export const APP_PDF_DEMO_PATH = "/app/pdf-demo" as const;
export const ORGANIZATION_PDF_DEMO_PATH = "/o/[organizationSlug]/pdf-demo" as const;
export const ORGANIZATION_SETTINGS_PATH = "/o/[organizationSlug]/settings" as const;
export const ORGANIZATION_SETTINGS_MEMBERS_PATH = "/o/[organizationSlug]/settings/members" as const;

export const DEFAULT_AUTH_REDIRECTS = {
  unauthenticatedTo: SIGN_IN_PATH,
  authenticatedTo: APP_HOME_PATH,
} as const;

export function getOrganizationRootPath(organizationSlug: string): string {
  return `${ORGANIZATION_PATH_PREFIX}/${organizationSlug}`;
}

export function getOrganizationOverviewPath(organizationSlug: string): string {
  return `${getOrganizationRootPath(organizationSlug)}/overview`;
}

export function getOrganizationPdfDemoPath(organizationSlug: string): string {
  return `${getOrganizationRootPath(organizationSlug)}/pdf-demo`;
}

export function getOrganizationSettingsPath(organizationSlug: string): string {
  return `${getOrganizationRootPath(organizationSlug)}/settings`;
}

export function getOrganizationOverviewHref(organizationSlug: string): AppHref {
  return {
    pathname: ORGANIZATION_OVERVIEW_PATH,
    params: {
      organizationSlug,
    },
  };
}

export function getOrganizationPdfDemoHref(organizationSlug: string): AppHref {
  return {
    pathname: ORGANIZATION_PDF_DEMO_PATH,
    params: {
      organizationSlug,
    },
  };
}

export function getOrganizationSettingsHref(organizationSlug: string): AppHref {
  return {
    pathname: ORGANIZATION_SETTINGS_PATH,
    params: {
      organizationSlug,
    },
  };
}

export function getInviteHref(token: string): AppHref {
  return {
    pathname: INVITE_PATH,
    params: {
      token,
    },
  };
}

export function getInviteAcceptHref(token: string): AppHref {
  return {
    pathname: INVITE_ACCEPT_PATH,
    params: {
      token,
    },
  };
}

export function getInviteStartHref(token: string): AppHref {
  return {
    pathname: INVITE_START_PATH,
    params: {
      token,
    },
  };
}
