import { authConfig } from "@/config/auth";
import { COOKIE_CONSENT_SUBJECT_COOKIE_NAME, COOKIE_NAME } from "@/config/cookie-consent";
import { preferencesConfig } from "@/config/preferences";
import { securityConfig } from "@/config/security";
import { workspaceConfig } from "@/config/workspace";
import { LOCALE_COOKIE_NAME } from "@/i18n/routing";
import type { Cookie } from "@/types/cookies";

// Terms-specific business and compliance toggles.
// The Terms page stays explicit; this config only controls larger optional blocks.
export type TermsOfServiceConfig = {
  minimumAge: number;
  // Render the consumer-rights section.
  supportsConsumers: boolean;
  // Mention that a free plan exists.
  hasFreePlan: boolean;
  // Mention that a trial exists. `trialDays` provides the displayed length.
  hasTrial: boolean;
  trialDays: number | null;
  // Mention available billing cadences.
  hasMonthlyBilling: boolean;
  hasAnnualBilling: boolean;
  // Mention recurring subscription renewal.
  hasAutoRenewal: boolean;
  // Mention AI-related features or outputs.
  hasAiFeatures: boolean;
  // Mention that user data export is available.
  hasDataExport: boolean;
  // Mention custom/enterprise support or SLA arrangements.
  hasEnterpriseSla: boolean;
  // Used in the liability cap wording.
  liabilityLookbackMonths: number;
  // Allow immediate suspension wording in the termination section.
  allowsImmediateSuspension: true;
  // Allow post-termination retention wording in the data-retention section.
  allowsPostTerminationRetention: boolean;
  // Mention DPA/processor relationship wording.
  usesDpa: boolean;
  // Reserved for future billing wording variants.
  refundPolicyMode: "by_plan_offer_order";
  // ADR contact details for the consumer section.
  adr: {
    authority: string;
    website: string;
    email: string;
    address: string;
  };
};

// GDPR/privacy-specific toggles.
// Keep only high-level switches that affect entire paragraphs or sections.
export type GdprPolicyConfig = {
  minimumAge: number;
  // Include references to marketing/newsletter communications.
  hasMarketingCommunications: boolean;
  // Include analytics-related processing purposes and explanations.
  hasAnalytics: boolean;
  // Include the cookies section and cookie-related processing references.
  hasCookies: boolean;
  // Include the section about transfers outside the EEA.
  hasThirdCountryTransfers: boolean;
  // Include the controller/processor split and DPA references.
  usesDpa: boolean;
  // Include the note that a processor list may exist separately.
  hasProcessorList: boolean;
  // Include a separate DPO contact line in the contact section.
  hasDpo: boolean;
  dpoEmail?: string;
};

// Cookie-policy category toggles.
// The cookie catalog itself is managed separately below.
export type CookiePolicyConfig = {
  // Include the section and category copy for functional/local storage.
  hasFunctionalStorage: boolean;
  // Include analytics cookies and analytics-specific explanations.
  hasAnalytics: boolean;
  // Include marketing cookies and marketing-specific explanations.
  hasMarketing: boolean;
};

type LegalDocumentDates = {
  termsOfService: string;
  gdprPolicy: string;
  cookiePolicy: string;
};

// Company and contact data shared across all legal documents.
type LegalConfig = {
  name: string;
  legalName: string;
  address: string;
  id: string;
  vatId?: string;
  domain: string;
  registration?: {
    court: string;
    fileNumber: string;
  };
  contact: {
    email: string;
    phone?: string;
    support: {
      email: string;
    };
    sales: {
      email: string;
      phone: string;
    };
  };
};

export const legal: LegalConfig = {
  name: "FBLS Tech s.r.o.",
  legalName: "FBLS Tech s.r.o.",
  address: "Moravská 854/2, 312 00 Plzeň",
  id: "19433166",
  domain: "www.gtdn.online",
  contact: {
    email: "hello@gtdn.online",
    phone: "+420123456789",
    support: {
      email: "support@gtdn.online",
    },
    sales: {
      email: "hello@gtdn.online",
      phone: "+420123456789",
    },
  },
};

// Current Terms variant for this product.
export const termsOfService: TermsOfServiceConfig = {
  minimumAge: 18,
  supportsConsumers: true,
  hasFreePlan: true,
  hasTrial: true,
  trialDays: 14,
  hasMonthlyBilling: true,
  hasAnnualBilling: true,
  hasAutoRenewal: true,
  hasAiFeatures: false,
  hasDataExport: true,
  hasEnterpriseSla: false,
  liabilityLookbackMonths: 12,
  allowsImmediateSuspension: true,
  allowsPostTerminationRetention: true,
  usesDpa: true,
  refundPolicyMode: "by_plan_offer_order",
  adr: {
    authority: "Česká obchodní inspekce",
    website: "www.coi.gov.cz",
    email: "adr@coi.gov.cz",
    address: "Štěpánská 567/15, 120 00 Praha 2",
  },
};

// Current Privacy/GDPR variant for this product.
export const gdprPolicy: GdprPolicyConfig = {
  minimumAge: 15,
  hasMarketingCommunications: true,
  hasAnalytics: true,
  hasCookies: true,
  hasThirdCountryTransfers: true,
  usesDpa: true,
  hasProcessorList: true,
  hasDpo: false,
};

// Current Cookie Policy category setup for this product.
export const cookiePolicy: CookiePolicyConfig = {
  hasFunctionalStorage: true,
  hasAnalytics: true,
  hasMarketing: true,
};

// Effective dates for the currently published legal documents.
// Keep values in ISO format so pages can localize them per locale.
export const legalDocumentDates: LegalDocumentDates = {
  termsOfService: "2026-03-03",
  gdprPolicy: "2025-01-01",
  cookiePolicy: "2025-01-01",
};

// Machine-readable cookie catalog rendered on the Cookie Policy page.
// Update this list when real cookies/providers/storage behavior changes.
export const cookieCatalog: Cookie[] = [
  {
    name: COOKIE_NAME,
    provider: legal.domain,
    purposeKey: "cookieConsent",
    duration: { kind: "relative", value: 1, unit: "year" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: COOKIE_CONSENT_SUBJECT_COOKIE_NAME,
    provider: legal.domain,
    purposeKey: "consentSubject",
    duration: { kind: "relative", value: 1, unit: "year" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: authConfig.cookies.authCookieName,
    provider: legal.domain,
    purposeKey: "authSession",
    duration: { kind: "conditional", labelKey: "sessionOrTokenExpiry" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: authConfig.cookies.persistCookieName,
    provider: legal.domain,
    purposeKey: "authPersist",
    duration: { kind: "conditional", labelKey: "sessionOrOneYear" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: securityConfig.deviceSessions.cookieName,
    provider: legal.domain,
    purposeKey: "deviceSession",
    duration: { kind: "conditional", labelKey: "sessionOrNinetyDays" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: workspaceConfig.cookies.pendingInvite.name,
    provider: legal.domain,
    purposeKey: "pendingInvite",
    duration: { kind: "relative", value: 7, unit: "day" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: LOCALE_COOKIE_NAME,
    provider: legal.domain,
    purposeKey: "locale",
    duration: { kind: "session" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: workspaceConfig.cookies.activeWorkspace.name,
    provider: legal.domain,
    purposeKey: "activeWorkspace",
    duration: { kind: "relative", value: 1, unit: "year" },
    category: "functional",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: true,
  },
  {
    name: "sidebar_state",
    provider: legal.domain,
    purposeKey: "sidebarState",
    duration: { kind: "relative", value: 7, unit: "day" },
    category: "essential",
    storageType: "cookie",
    thirdParty: false,
    requiresConsent: false,
  },
  {
    name: preferencesConfig.theme.storageKey,
    provider: legal.domain,
    purposeKey: "theme",
    duration: { kind: "persistent" },
    category: "essential",
    storageType: "localStorage",
    thirdParty: false,
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
