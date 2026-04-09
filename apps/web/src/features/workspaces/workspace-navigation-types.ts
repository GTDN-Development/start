import type { WorkspaceMemberRole } from "@/features/workspaces/workspace-role-rules";

export type WorkspaceNavigationItem = {
  id: string;
  slug: string;
  name: string;
  role: WorkspaceMemberRole;
  avatarUrl: string | null;
};
