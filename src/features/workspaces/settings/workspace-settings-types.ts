import type {
  WorkspaceInvitableRole,
  WorkspaceMemberRole,
} from "@/features/workspaces/workspace-role-rules";

export type WorkspaceSettingsWorkspace = {
  id: string;
  slug: string;
  name: string;
  currentUserId: string;
  role: WorkspaceMemberRole;
  isCurrentUserLastOwner: boolean;
  avatarUrl: string | null;
};

export type WorkspaceSettingsMember = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: WorkspaceMemberRole;
};

export type WorkspaceSettingsInvite = {
  id: string;
  emailNormalized: string;
  role: WorkspaceInvitableRole;
  expiresAt: string;
  updatedAt: string;
  invitedByName: string | null;
  inviteUrl: string | null;
};
