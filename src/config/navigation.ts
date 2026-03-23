import type { AppPathname } from "@/i18n/navigation";
import type { AppIcon } from "@/types/icons";
import { LayoutDashboardIcon, LifeBuoyIcon, SettingsIcon, UserIcon } from "lucide-react";

type MenuHref = AppPathname;
type ApplicationMenuHref = MenuHref | "/w/[workspaceSlug]/overview" | "/w/[workspaceSlug]/settings";

export type MenuLinkLabelKey =
  | "home"
  | "app"
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
  | "workspace"
  | "overview"
  | "settings"
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

export const personalApplicationMenu = [
  { labelKey: "home", href: "/app", icon: LayoutDashboardIcon },
  { labelKey: "account", href: "/account", icon: UserIcon, matchNested: true },
  { labelKey: "support", href: "/contact/support", icon: LifeBuoyIcon },
] as const satisfies ReadonlyArray<{
  labelKey: "home" | "account" | "support";
  href: MenuHref;
  icon: AppIcon;
  matchNested?: boolean;
}>;

export const workspaceApplicationMenu = [
  { labelKey: "overview", href: "/w/[workspaceSlug]/overview", icon: LayoutDashboardIcon },
  {
    labelKey: "settings",
    href: "/w/[workspaceSlug]/settings",
    icon: SettingsIcon,
    matchNested: true,
  },
  { labelKey: "support", href: "/contact/support", icon: LifeBuoyIcon },
] as const satisfies ReadonlyArray<{
  labelKey: "overview" | "settings" | "support";
  href: ApplicationMenuHref;
  icon: AppIcon;
  matchNested?: boolean;
}>;

export type PersonalApplicationMenuLink = (typeof personalApplicationMenu)[number];
export type WorkspaceApplicationMenuLink = (typeof workspaceApplicationMenu)[number];
export type ApplicationMenuLink = PersonalApplicationMenuLink | WorkspaceApplicationMenuLink;

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
