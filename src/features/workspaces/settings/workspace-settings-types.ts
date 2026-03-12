export type WorkspaceSettingsWorkspace = {
  id: string;
  slug: string;
  name: string;
  kind: "personal" | "organization";
  role: "owner" | "member";
  isCurrentUserLastOwner: boolean;
  avatarUrl: string | null;
};

export type WorkspaceSettingsMember = {
  id: string;
  userId: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
  role: "owner" | "member";
};

export type WorkspaceSettingsInvite = {
  id: string;
  emailNormalized: string;
  role: "member";
  expiresAt: string;
  updatedAt: string;
  invitedByName: string | null;
};
