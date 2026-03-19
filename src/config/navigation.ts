import type { AppPathname } from "@/i18n/navigation";

type MenuHref = AppPathname;

export type MenuLinkLabelKey =
  | "home"
  | "contact"
  | "support"
  | "pricing"
  | "blog"
  | "features"
  | "integrations"
  | "changelog"
  | "roadmap"
  | "signIn"
  | "signUp"
  | "overview"
  | "workspace"
  | "account"
  | "privacyPolicy"
  | "termsOfService"
  | "cookiePolicy";

export type MenuNestedLabelKey = "aboutApp";

export type MenuLabelKey = MenuLinkLabelKey | MenuNestedLabelKey;

export type MenuLink = {
  labelKey: MenuLinkLabelKey;
  href: MenuHref;
};

export type MenuNested = {
  labelKey: MenuNestedLabelKey;
  items: MenuLink[];
};

export type MenuItem = MenuLink | MenuNested;

export type LegalLinkKey = "gdpr" | "termsOfService" | "cookies";

export const legalLinks = {
  gdpr: { labelKey: "privacyPolicy", href: "/gdpr" },
  termsOfService: { labelKey: "termsOfService", href: "/terms-of-service" },
  cookies: { labelKey: "cookiePolicy", href: "/cookies" },
} as const satisfies Record<LegalLinkKey, MenuLink>;

export const marketingMenu: MenuItem[] = [
  { labelKey: "home", href: "/" },
  {
    labelKey: "aboutApp",
    items: [
      { labelKey: "features", href: "/about/features" },
      { labelKey: "integrations", href: "/about/integrations" },
      { labelKey: "changelog", href: "/about/changelog" },
      { labelKey: "roadmap", href: "/about/roadmap" },
    ],
  },
  { labelKey: "pricing", href: "/pricing" },
  { labelKey: "blog", href: "/blog" },
  { labelKey: "contact", href: "/contact" },
];

export const applicationMenu: MenuLink[] = [
  { labelKey: "overview", href: "/overview" },
  { labelKey: "workspace", href: "/overview" },
  { labelKey: "account", href: "/account" },
  { labelKey: "support", href: "/contact/support" },
];

export const applicationFooterMenu: MenuLink[] = [
  { labelKey: "home", href: "/" },
  { labelKey: "blog", href: "/blog" },
  { labelKey: "contact", href: "/contact" },
];

export const authMenu: MenuLink[] = [
  { labelKey: "signIn", href: "/sign-in" },
  { labelKey: "signUp", href: "/sign-up" },
];

export const legalItems: MenuLink[] = [
  legalLinks.gdpr,
  legalLinks.termsOfService,
  legalLinks.cookies,
];

export function isNested(item: MenuItem): item is MenuNested {
  return "items" in item;
}
