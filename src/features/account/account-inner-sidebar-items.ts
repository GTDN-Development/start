import { ACCOUNT_PATH } from "@/config/routes";
import type { InnerSidebarItemDefinition } from "@/features/application/inner-sidebar/inner-sidebar-items";

export const accountInnerSidebarItems = [
  {
    href: ACCOUNT_PATH,
    labelKey: "nav.profile",
    icon: "user",
  },
  {
    href: "/account/preferences",
    labelKey: "nav.preferences",
    icon: "slidersHorizontal",
  },
  {
    href: "/account/security",
    labelKey: "nav.security",
    icon: "shield",
    matchNested: true,
  },
] as const satisfies ReadonlyArray<
  InnerSidebarItemDefinition<"nav.preferences" | "nav.profile" | "nav.security">
>;
