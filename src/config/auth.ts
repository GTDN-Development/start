import type { AppPathname } from "@/i18n/navigation";

export type AuthEmailLinkAction = "verify-email" | "reset-password" | "confirm-email-change";

export const AUTH_PROTECTED_ROUTE_PREFIXES = ["/overview", "/w", "/account"] as const;

export const AUTH_REDIRECTS = {
  unauthenticatedTo: "/sign-in",
  authenticatedTo: "/overview",
} as const;

export const AUTH_EMAIL_LINK_ACTION_TARGETS = {
  "verify-email": "/verify-email",
  "reset-password": "/reset-password",
  "confirm-email-change": "/confirm-email-change",
} as const satisfies Record<AuthEmailLinkAction, AppPathname>;

export const AUTH_FIRST_NAME_MIN_LENGTH = 2;
export const AUTH_FIRST_NAME_MAX_LENGTH = 50;
export const AUTH_LAST_NAME_MIN_LENGTH = 2;
export const AUTH_LAST_NAME_MAX_LENGTH = 50;
export const AUTH_PASSWORD_MIN_LENGTH = 8;
export const AUTH_PASSWORD_MAX_LENGTH = 100;

export const PB_AUTH_COOKIE_NAME = "pb_auth";
export const PB_AUTH_PERSIST_COOKIE_NAME = "pb_auth_persist";
export const AUTH_PERSIST_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
