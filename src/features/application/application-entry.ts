import type { AppHref } from "@/i18n/navigation";
import { APP_HOME_PATH, getWorkspaceOverviewHref } from "@/config/routes";
import { getActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";
import { resolveWorkspaceForUserBySlug } from "@/server/workspaces/workspace-resolution-service";

export async function resolveApplicationEntryHref(userId: string): Promise<AppHref> {
  const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();

  if (!activeWorkspaceSlug) {
    return APP_HOME_PATH;
  }

  const workspaceResponse = await resolveWorkspaceForUserBySlug(userId, activeWorkspaceSlug);

  if (!workspaceResponse.ok || !workspaceResponse.data.workspace) {
    return APP_HOME_PATH;
  }

  return getWorkspaceOverviewHref(workspaceResponse.data.workspace.slug);
}
