import { ACCOUNT_PATH, ACCOUNT_PREFERENCES_PATH, ACCOUNT_SECURITY_PATH } from "@/config/routes";
import type { InnerSidebarItemDefinition } from "@/features/application/inner-sidebar/inner-sidebar-items";

export const accountInnerSidebarItems = [
  {
    href: ACCOUNT_PATH,
    labelKey: "nav.profile",
    icon: "user",
  },
  {
    href: ACCOUNT_PREFERENCES_PATH,
    labelKey: "nav.preferences",
    icon: "slidersHorizontal",
  },
  {
    href: ACCOUNT_SECURITY_PATH,
    labelKey: "nav.security",
    icon: "shield",
    matchNested: true,
  },
] as const satisfies ReadonlyArray<
  InnerSidebarItemDefinition<"nav.preferences" | "nav.profile" | "nav.security">
>;
