import type { AppHref } from "@/i18n/navigation";
import { APP_HOME_PATH, getWorkspaceOverviewHref } from "@/config/routes";
import { resolveActiveWorkspaceForUser } from "@/server/workspaces/workspace-resolution-service";

export async function resolveApplicationEntryHref(userId: string): Promise<AppHref> {
  const workspaceResponse = await resolveActiveWorkspaceForUser(userId);

  if (!workspaceResponse.ok || !workspaceResponse.data.workspace) {
    return APP_HOME_PATH;
  }

  return getWorkspaceOverviewHref(workspaceResponse.data.workspace.slug);
}
