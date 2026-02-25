import type { Cookie } from "@/types/cookies";
import { site } from "./site";

export const cookies: Cookie[] = [
  // Essential Cookies
  {
    name: "cookie_consent",
    provider: site.domain,
    purposeKey: "cookieConsent",
    duration: { kind: "relative", value: 1, unit: "year" },
    category: "essential",
    storageType: "cookie",
  },
  {
    name: "cookie_consent_subject",
    provider: site.domain,
    purposeKey: "cookieConsentSubject",
    duration: { kind: "relative", value: 1, unit: "year" },
    category: "essential",
    storageType: "cookie",
  },

  // Functional Storage
  {
    name: "theme",
    provider: site.domain,
    purposeKey: "theme",
    duration: { kind: "persistent" },
    category: "functional",
    storageType: "localStorage",
  },

  // Analytics Cookies (Google Analytics - only loaded when analytics consent is given)
  {
    name: "_ga",
    provider: "Google Analytics",
    purposeKey: "ga",
    duration: { kind: "relative", value: 2, unit: "year" },
    category: "analytics",
    storageType: "cookie",
  },
  {
    name: "_ga_*",
    provider: "Google Analytics",
    purposeKey: "gaWildcard",
    duration: { kind: "relative", value: 2, unit: "year" },
    category: "analytics",
    storageType: "cookie",
  },
  {
    name: "_gid",
    provider: "Google Analytics",
    purposeKey: "gid",
    duration: { kind: "relative", value: 24, unit: "hour" },
    category: "analytics",
    storageType: "cookie",
  },
  {
    name: "_gat",
    provider: "Google Analytics",
    purposeKey: "gat",
    duration: { kind: "relative", value: 1, unit: "minute" },
    category: "analytics",
    storageType: "cookie",
  },

  // Google Tag Manager Cookies (only loaded when analytics consent is given)
  {
    name: "_gcl_au",
    provider: "Google Tag Manager",
    purposeKey: "gclAu",
    duration: { kind: "relative", value: 3, unit: "month" },
    category: "analytics",
    storageType: "cookie",
  },
];
