import type { AppPathname } from "@/i18n/navigation";
import {
  ACCOUNT_PATH,
  APP_HOME_PATH,
  DEFAULT_AUTH_REDIRECTS,
  WORKSPACE_PATH_PREFIX,
} from "@/config/routes";

const emailLinkActionTargets = {
  "verify-email": "/verify-email",
  "reset-password": "/reset-password",
  "confirm-email-change": "/confirm-email-change",
} as const satisfies Record<string, AppPathname>;

export type AuthEmailLinkAction = keyof typeof emailLinkActionTargets;

export const AUTH_PROTECTED_ROUTE_PREFIXES = [
  APP_HOME_PATH,
  WORKSPACE_PATH_PREFIX,
  ACCOUNT_PATH,
] as const;

export const AUTH_REDIRECTS = DEFAULT_AUTH_REDIRECTS;

export const authConfig = {
  routes: {
    protectedPrefixes: AUTH_PROTECTED_ROUTE_PREFIXES,
    redirects: AUTH_REDIRECTS,
    emailLinkActionTargets,
  },
  limits: {
    firstNameMinLength: 2,
    firstNameMaxLength: 50,
    lastNameMinLength: 2,
    lastNameMaxLength: 50,
    passwordMinLength: 8,
    passwordMaxLength: 100,
  },
  cookies: {
    authCookieName: "pb_auth",
    persistCookieName: "pb_auth_persist",
    persistCookieMaxAgeSeconds: 60 * 60 * 24 * 365,
  },
} as const;
