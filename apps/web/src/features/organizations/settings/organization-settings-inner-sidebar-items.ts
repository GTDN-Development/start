import { ORGANIZATION_SETTINGS_MEMBERS_PATH, ORGANIZATION_SETTINGS_PATH } from "@/config/routes";
import type { OrganizationInnerSidebarItemDefinition } from "@/features/application/inner-sidebar/inner-sidebar-items";

type OrganizationSettingsInnerSidebarPathname =
  | typeof ORGANIZATION_SETTINGS_PATH
  | typeof ORGANIZATION_SETTINGS_MEMBERS_PATH;

export const organizationSettingsInnerSidebarItems = [
  {
    href: ORGANIZATION_SETTINGS_PATH,
    labelKey: "general",
    icon: "slidersHorizontal",
  },
  {
    href: ORGANIZATION_SETTINGS_MEMBERS_PATH,
    labelKey: "members",
    icon: "users",
  },
] as const satisfies ReadonlyArray<
  OrganizationInnerSidebarItemDefinition<
    "general" | "members",
    OrganizationSettingsInnerSidebarPathname
  >
>;
