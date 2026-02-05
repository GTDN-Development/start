import type { Route } from "next";

export type LegalLinkLabelKey = "privacyPolicy" | "cookiePolicy";

export type LegalLink<T extends string = string> = {
  label: LegalLinkLabelKey;
  href: Route<T>;
};

export const legalLinks = {
  gdpr: { label: "privacyPolicy", href: "/gdpr" },
  cookies: { label: "cookiePolicy", href: "/cookies" },
} as const satisfies Record<string, LegalLink>;

export const legalLinksArray: LegalLink[] = Object.values(legalLinks);
