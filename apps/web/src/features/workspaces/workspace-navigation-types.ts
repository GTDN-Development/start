import type { WorkspaceMemberRole } from "@/features/workspaces/workspace-role-rules";
import type { AppHref } from "@/i18n/navigation";

export type WorkspaceNavigationItem = {
  id: string;
  slug: string;
  name: string;
  role: WorkspaceMemberRole;
  avatarUrl: string | null;
};

export type WorkspaceNavigationPatch = {
  upsertWorkspace?: WorkspaceNavigationItem;
  removeWorkspaceId?: string;
  activeWorkspaceSlug?: string | null;
  redirectHref?: AppHref;
};
