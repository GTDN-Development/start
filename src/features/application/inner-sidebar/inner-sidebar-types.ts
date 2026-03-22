import { type AppHref } from "@/i18n/navigation";

export type InnerSidebarIconKey = "shield" | "slidersHorizontal" | "user" | "users";

export type InnerSidebarNavItem = {
  href: AppHref;
  label: string;
  icon?: InnerSidebarIconKey;
  matchNested?: boolean;
  activePathnames?: string[];
  activePathPrefixes?: string[];
};
