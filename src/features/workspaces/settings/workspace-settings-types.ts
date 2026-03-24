export type WorkspaceSettingsWorkspace = {
  id: string;
  slug: string;
  name: string;
  currentUserId: string;
  role: "owner" | "admin" | "member";
  isCurrentUserLastOwner: boolean;
  avatarUrl: string | null;
};

export type WorkspaceSettingsMember = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: "owner" | "admin" | "member";
};

export type WorkspaceSettingsInvite = {
  id: string;
  emailNormalized: string;
  role: "admin" | "member";
  expiresAt: string;
  updatedAt: string;
  invitedByName: string | null;
  inviteUrl: string | null;
};
