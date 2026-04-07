import { WORKSPACE_SETTINGS_MEMBERS_PATH, WORKSPACE_SETTINGS_PATH } from "@/config/routes";
import type { WorkspaceInnerSidebarItemDefinition } from "@/features/application/inner-sidebar/inner-sidebar-items";

type WorkspaceSettingsInnerSidebarPathname =
  | typeof WORKSPACE_SETTINGS_PATH
  | typeof WORKSPACE_SETTINGS_MEMBERS_PATH;

export const workspaceSettingsInnerSidebarItems = [
  {
    href: WORKSPACE_SETTINGS_PATH,
    labelKey: "general",
    icon: "slidersHorizontal",
  },
  {
    href: WORKSPACE_SETTINGS_MEMBERS_PATH,
    labelKey: "members",
    icon: "users",
  },
] as const satisfies ReadonlyArray<
  WorkspaceInnerSidebarItemDefinition<"general" | "members", WorkspaceSettingsInnerSidebarPathname>
>;
