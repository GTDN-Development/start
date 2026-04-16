import {
  clearActiveWorkspaceSlugCookie,
  clearPendingInviteTokenCookie,
} from "@/server/workspaces/workspace-cookie";

export async function clearSessionScopedApplicationState(): Promise<void> {
  await clearActiveWorkspaceSlugCookie();
  await clearPendingInviteTokenCookie();
}
