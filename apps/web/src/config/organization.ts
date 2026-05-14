const ORGANIZATIONS_ENABLED_ENV = process.env.NEXT_PUBLIC_ORGANIZATIONS_ENABLED;

export const organizationConfig = {
  enabled: isOrganizationFeatureEnabled(ORGANIZATIONS_ENABLED_ENV),
  limits: {
    nameMaxLength: 32,
    slugMaxLength: 48,
    avatarMaxSizeBytes: 1024 * 1024,
    maxOrganizationsPerUser: null as number | null,
    maxMembersPerOrganization: null as number | null,
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
    activeOrganization: {
      name: "active_organization",
      maxAgeSeconds: 60 * 60 * 24 * 365,
    },
    pendingInvite: {
      name: "pending_invite",
      maxAgeSeconds: 60 * 60 * 24 * 7,
    },
  },
  roles: {
    memberValues: ["owner", "admin", "member"] as const,
    invitableValues: ["admin", "member"] as const,
  },
} as const;

function isOrganizationFeatureEnabled(value: string | undefined) {
  const normalizedValue = value?.trim().toLowerCase();

  if (normalizedValue === "true") {
    return true;
  }

  if (normalizedValue === "false") {
    return false;
  }

  return false;
}
