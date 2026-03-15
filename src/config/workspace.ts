export const workspaceConfig = {
  limits: {
    nameMaxLength: 32,
    slugMaxLength: 48,
    avatarMaxSizeBytes: 1024 * 1024,
  },
  validation: {
    slugPattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  },
  invites: {
    ttlDays: 7,
    resendCooldownSeconds: 60,
    tokenBytes: 32,
  },
  cookies: {
    activeWorkspace: {
      name: "active_workspace",
      maxAgeSeconds: 60 * 60 * 24 * 365,
    },
    pendingInvite: {
      name: "pending_invite",
      maxAgeSeconds: 60 * 60 * 24 * 7,
    },
  },
  roles: {
    memberValues: ["owner", "member"] as const,
    invitableValues: ["member"] as const,
  },
} as const;
