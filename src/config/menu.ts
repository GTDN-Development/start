import type { LinkProps } from "@/components/ui/link";
import { legalLinks } from "./legal-links";

export type MenuLinkLabelKey =
  | "home"
  | "contact"
  | "login"
  | "signUp"
  | "privacyPolicy"
  | "cookiePolicy";

export type MenuNestedLabelKey = "account";

export type MenuLabelKey = MenuLinkLabelKey | MenuNestedLabelKey;

export type MenuLink = {
  labelKey: MenuLinkLabelKey;
  href: Extract<LinkProps["href"], string>;
};

export type MenuNested = {
  labelKey: MenuNestedLabelKey;
  items: MenuLink[];
};

export type MenuItem = MenuLink | MenuNested;

export type MenuPreset = "header" | "mobile" | "footerNavigation" | "footerLegal";

type MenuPresetEntry =
  | MenuLinkLabelKey
  | {
      labelKey: MenuNestedLabelKey;
      items: readonly MenuLinkLabelKey[];
    };

export const menuLinks = {
  home: { labelKey: "home", href: "/" },
  contact: { labelKey: "contact", href: "/contact" },
  login: { labelKey: "login", href: "/login" },
  signUp: { labelKey: "signUp", href: "/sign-up" },
  privacyPolicy: { labelKey: legalLinks.gdpr.label, href: legalLinks.gdpr.href },
  cookiePolicy: { labelKey: legalLinks.cookies.label, href: legalLinks.cookies.href },
} as const satisfies Record<MenuLinkLabelKey, MenuLink>;

export const menuPresets = {
  header: ["home", "contact", { labelKey: "account", items: ["login", "signUp"] }],
  mobile: ["home", "contact", { labelKey: "account", items: ["login", "signUp"] }],
  footerNavigation: ["home", "contact", { labelKey: "account", items: ["login", "signUp"] }],
  footerLegal: ["privacyPolicy", "cookiePolicy"],
} as const satisfies Record<MenuPreset, readonly MenuPresetEntry[]>;

export function isNested(item: MenuItem): item is MenuNested {
  return "items" in item;
}

export function getMenu(preset: MenuPreset): MenuItem[] {
  return menuPresets[preset].map((entry) => {
    if (typeof entry === "string") {
      return menuLinks[entry];
    }

    return {
      labelKey: entry.labelKey,
      items: entry.items.map((label) => menuLinks[label]),
    };
  });
}

export function getMenuLinks(preset: MenuPreset): MenuLink[] {
  return getMenu(preset).flatMap((item) => (isNested(item) ? item.items : item));
}
