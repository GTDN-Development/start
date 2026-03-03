import type { Route } from "next";

export type LegalLinkLabelKey = "privacyPolicy" | "cookiePolicy" | "termsOfService";

export type LegalLink<T extends string = string> = {
  label: LegalLinkLabelKey;
  href: Route<T>;
};

export const legalLinks = {
  gdpr: { label: "privacyPolicy", href: "/gdpr" },
  termsOfService: { label: "termsOfService", href: "/terms-of-service" },
  cookies: { label: "cookiePolicy", href: "/cookies" },
} as const satisfies Record<string, LegalLink>;
