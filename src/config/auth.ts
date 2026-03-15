import type { AppPathname } from "@/i18n/navigation";

const emailLinkActionTargets = {
  "verify-email": "/verify-email",
  "reset-password": "/reset-password",
  "confirm-email-change": "/confirm-email-change",
} as const satisfies Record<string, AppPathname>;

export type AuthEmailLinkAction = keyof typeof emailLinkActionTargets;

export const authConfig = {
  routes: {
    protectedPrefixes: ["/overview", "/w", "/account"] as const,
    redirects: {
      unauthenticatedTo: "/sign-in",
      authenticatedTo: "/overview",
    },
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
