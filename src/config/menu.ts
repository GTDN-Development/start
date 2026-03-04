import type { AppPathname } from "@/i18n/navigation";
import { legalLinks } from "./legal-links";

type MenuHref = AppPathname;

export type MenuLinkLabelKey =
  | "home"
  | "contact"
  | "pricing"
  | "blog"
  | "features"
  | "integrations"
  | "roadmap"
  | "signIn"
  | "signUp"
  | "overview"
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

export const marketingMenu: MenuItem[] = [
  { labelKey: "home", href: "/" },
  {
    labelKey: "aboutApp",
    items: [
      { labelKey: "features", href: "/about/features" },
      { labelKey: "integrations", href: "/about/integrations" },
      { labelKey: "roadmap", href: "/about/roadmap" },
    ],
  },
  { labelKey: "pricing", href: "/pricing" },
  { labelKey: "blog", href: "/blog" },
  { labelKey: "contact", href: "/contact" },
];

export const applicationMenu: MenuLink[] = [
  { labelKey: "overview", href: "/overview" },
  { labelKey: "account", href: "/account" },
];

export const authMenu: MenuLink[] = [
  { labelKey: "signIn", href: "/sign-in" },
  { labelKey: "signUp", href: "/sign-up" },
];

export const legalItems: MenuLink[] = [
  { labelKey: legalLinks.gdpr.label, href: legalLinks.gdpr.href },
  { labelKey: legalLinks.termsOfService.label, href: legalLinks.termsOfService.href },
  { labelKey: legalLinks.cookies.label, href: legalLinks.cookies.href },
];

export function isNested(item: MenuItem): item is MenuNested {
  return "items" in item;
}
