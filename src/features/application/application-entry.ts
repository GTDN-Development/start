import type { AppHref } from "@/i18n/navigation";
import { getActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";
import { resolveWorkspaceForUserBySlug } from "@/server/workspaces/workspace-resolution-service";

export async function resolveApplicationEntryHref(userId: string): Promise<AppHref> {
  const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();

  if (!activeWorkspaceSlug) {
    return "/app";
  }

  const workspaceResponse = await resolveWorkspaceForUserBySlug(userId, activeWorkspaceSlug);

  if (!workspaceResponse.ok || !workspaceResponse.data.workspace) {
    return "/app";
  }

  return {
    pathname: "/w/[workspaceSlug]/overview",
    params: {
      workspaceSlug: workspaceResponse.data.workspace.slug,
    },
  };
}
