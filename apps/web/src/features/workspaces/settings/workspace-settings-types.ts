import type {
  WorkspaceInviteSummary,
  WorkspaceMemberRole,
  WorkspaceMemberSummary,
} from "@/features/workspaces/workspace-types";

export type WorkspaceSettingsWorkspace = {
  id: string;
  slug: string;
  name: string;
  currentUserId: string;
  role: WorkspaceMemberRole;
  isCurrentUserLastOwner: boolean;
  avatarUrl: string | null;
};

export type WorkspaceSettingsMember = WorkspaceMemberSummary;
export type WorkspaceSettingsInvite = WorkspaceInviteSummary;
