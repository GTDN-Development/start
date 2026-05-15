import { authConfig } from "@/config/auth";
import { COOKIE_CONSENT_SUBJECT_COOKIE_NAME, COOKIE_NAME } from "@/config/cookie-consent";
import { organizationConfig } from "@/config/organization";
import { preferencesConfig } from "@/config/preferences";
import { product } from "@/config/product";
import { LOCALE_COOKIE_NAME } from "@/i18n/routing";
import type { Cookie } from "@/types/cookies";

export type CookiePolicyConfig = {
  hasFunctionalStorage: boolean;
  hasAnalytics: boolean;
  hasMarketing: boolean;
};

export const cookiePolicy: CookiePolicyConfig = {
  hasFunctionalStorage: true,
  hasAnalytics: true,
  hasMarketing: false,
};

export const cookiePolicyUpdatedAt = "2025-01-01";

export const cookieCatalog: Cookie[] = [
  {
    name: COOKIE_NAME,
    provider: product.site.domain,
    purposeKey: "cookieConsent",
    duration: { kind: "relative", value: 1, unit: "year" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: COOKIE_CONSENT_SUBJECT_COOKIE_NAME,
    provider: product.site.domain,
    purposeKey: "consentSubject",
    duration: { kind: "relative", value: 1, unit: "year" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: authConfig.cookies.authCookieName,
    provider: product.site.domain,
    purposeKey: "authSession",
    duration: { kind: "conditional", labelKey: "sessionOrTokenExpiry" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: authConfig.cookies.persistCookieName,
    provider: product.site.domain,
    purposeKey: "authPersist",
    duration: { kind: "conditional", labelKey: "sessionOrOneYear" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: organizationConfig.cookies.pendingInvite.name,
    provider: product.site.domain,
    purposeKey: "pendingInvite",
    duration: { kind: "relative", value: 7, unit: "day" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: LOCALE_COOKIE_NAME,
    provider: product.site.domain,
    purposeKey: "locale",
    duration: { kind: "session" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: organizationConfig.cookies.activeOrganization.name,
    provider: product.site.domain,
    purposeKey: "activeOrganization",
    duration: { kind: "relative", value: 1, unit: "year" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: "sidebar_state",
    provider: product.site.domain,
    purposeKey: "sidebarState",
    duration: { kind: "relative", value: 7, unit: "day" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: preferencesConfig.theme.storageKey,
    provider: product.site.domain,
    purposeKey: "theme",
    duration: { kind: "persistent" },
    category: "essential",
    storageType: "localStorage",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: "Cloudflare Turnstile",
    provider: "Cloudflare",
    purposeKey: "turnstileSecurity",
    duration: { kind: "conditional", labelKey: "providerManagedSecurity" },
    category: "essential",
    storageType: "cookie",
    thirdParty: true,
    requiresConsent: false,
  },
  {
    name: "_ga",
    provider: "Google Analytics",
    purposeKey: "ga",
    duration: { kind: "relative", value: 2, unit: "year" },
    category: "analytics",
    storageType: "cookie",
    thirdParty: true,
    requiresConsent: true,
  },
  {
    name: "_ga_*",
    provider: "Google Analytics",
    purposeKey: "gaWildcard",
    duration: { kind: "relative", value: 2, unit: "year" },
    category: "analytics",
    storageType: "cookie",
    thirdParty: true,
    requiresConsent: true,
  },
];
