import type { AppPathname } from "@/i18n/navigation";
import {
  ACCOUNT_PATH,
  APP_HOME_PATH,
  CONFIRM_EMAIL_CHANGE_PATH,
  VERIFY_EMAIL_COMPLETE_PATH,
  DEFAULT_AUTH_REDIRECTS,
  RESET_PASSWORD_PATH,
  ORGANIZATION_PATH_PREFIX,
} from "@/config/routes";

const emailLinkActionTargets = {
  "verify-email": VERIFY_EMAIL_COMPLETE_PATH,
  "reset-password": RESET_PASSWORD_PATH,
  "confirm-email-change": CONFIRM_EMAIL_CHANGE_PATH,
} as const satisfies Record<string, AppPathname>;

export type AuthEmailLinkAction = keyof typeof emailLinkActionTargets;

export const AUTH_PROTECTED_ROUTE_PREFIXES = [
  APP_HOME_PATH,
  ORGANIZATION_PATH_PREFIX,
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
  },
  passwordPolicy: {
    minLength: 8,
    maxLength: 100,
    minUppercase: 1,
    minNumbers: 1,
    minSpecialCharacters: 1,
  },
  cookies: {
    authCookieName: "pb_auth",
    persistCookieName: "pb_auth_persist",
    persistCookieMaxAgeSeconds: 60 * 60 * 24 * 365,
  },
} as const;
