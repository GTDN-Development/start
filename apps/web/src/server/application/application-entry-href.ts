import type { AppHref } from "@/i18n/navigation";
import { APP_HOME_PATH, getWorkspaceOverviewHref } from "@/config/routes";
import { resolveActiveWorkspaceSlugForUser } from "@/server/workspaces/workspace-resolution-service";

export async function resolveApplicationEntryHref(userId: string): Promise<AppHref> {
  const workspaceResponse = await resolveActiveWorkspaceSlugForUser(userId);

  if (!workspaceResponse.ok || !workspaceResponse.data.workspaceSlug) {
    return APP_HOME_PATH;
  }

  return getWorkspaceOverviewHref(workspaceResponse.data.workspaceSlug);
}
