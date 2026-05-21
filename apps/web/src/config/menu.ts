import type { AppPathname } from "@/i18n/navigation";
import {
  ACCOUNT_PATH,
  APP_PDF_DEMO_PATH,
  APP_HOME_PATH,
  ORGANIZATION_PDF_DEMO_PATH,
  ORGANIZATION_OVERVIEW_PATH,
  ORGANIZATION_SETTINGS_PATH,
} from "@/config/routes";
import type { AppIcon } from "@/types/icons";
import {
  FileTextIcon,
  LayoutDashboardIcon,
  LifeBuoyIcon,
  SettingsIcon,
  UserIcon,
} from "lucide-react";

type MenuHref = AppPathname;
type ApplicationMenuHref =
  | MenuHref
  | typeof APP_PDF_DEMO_PATH
  | typeof ORGANIZATION_OVERVIEW_PATH
  | typeof ORGANIZATION_PDF_DEMO_PATH
  | typeof ORGANIZATION_SETTINGS_PATH;

type MenuLinkLabelKey =
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
  | "organization"
  | "overview"
  | "settings"
  | "pdfDemo"
  | "account"
  | "myAccount"
  | "privacyPolicy"
  | "termsOfService"
  | "cookiePolicy";

type MenuNestedLabelKey = "aboutApp" | "legal";

export type MenuLabelKey = MenuLinkLabelKey | MenuNestedLabelKey;

export type MenuLink = {
  labelKey: MenuLinkLabelKey;
  href: MenuHref;
  icon?: AppIcon;
  matchNested?: boolean;
};

type MenuNested = {
  labelKey: MenuNestedLabelKey;
  items: MenuLink[];
};

export type MenuItem = MenuLink | MenuNested;

type LegalLinkKey = "gdpr" | "termsOfService" | "cookies";

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
  { labelKey: "blog", href: "/blog", matchNested: true },
  { labelKey: "contact", href: "/contact", matchNested: true },
];

export const personalApplicationMenu = [
  { labelKey: "home", href: APP_HOME_PATH, icon: LayoutDashboardIcon },
  { labelKey: "pdfDemo", href: APP_PDF_DEMO_PATH, icon: FileTextIcon },
] as const satisfies ReadonlyArray<{
  labelKey: "home" | "pdfDemo";
  href: MenuHref;
  icon: AppIcon;
  matchNested?: boolean;
}>;

export const organizationApplicationMenu = [
  { labelKey: "overview", href: ORGANIZATION_OVERVIEW_PATH, icon: LayoutDashboardIcon },
  { labelKey: "pdfDemo", href: ORGANIZATION_PDF_DEMO_PATH, icon: FileTextIcon },
  {
    labelKey: "settings",
    href: ORGANIZATION_SETTINGS_PATH,
    icon: SettingsIcon,
    matchNested: true,
  },
] as const satisfies ReadonlyArray<{
  labelKey: "overview" | "pdfDemo" | "settings";
  href: ApplicationMenuHref;
  icon: AppIcon;
  matchNested?: boolean;
}>;

export const applicationSidebarFooterMenu = [
  { labelKey: "myAccount", href: ACCOUNT_PATH, icon: UserIcon, matchNested: true },
  { labelKey: "support", href: "/contact/support", icon: LifeBuoyIcon, matchNested: true },
] as const satisfies ReadonlyArray<{
  labelKey: "myAccount" | "support";
  href: ApplicationMenuHref;
  icon: AppIcon;
  matchNested?: boolean;
}>;

type PersonalApplicationMenuLink = (typeof personalApplicationMenu)[number];
type OrganizationApplicationMenuLink = (typeof organizationApplicationMenu)[number];
export type ApplicationMenuLink = PersonalApplicationMenuLink | OrganizationApplicationMenuLink;

export const legalItems: MenuLink[] = [
  legalLinks.gdpr,
  legalLinks.termsOfService,
  legalLinks.cookies,
];

export const applicationFooterMenu: MenuItem[] = [
  { labelKey: "home", href: "/" },
  { labelKey: "blog", href: "/blog", matchNested: true },
  { labelKey: "contact", href: "/contact", matchNested: true },
  { labelKey: "legal", items: legalItems },
];
