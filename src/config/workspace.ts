export const MAX_WORKSPACE_NAME_LENGTH = 32;
export const MAX_WORKSPACE_SLUG_LENGTH = 48;
export const MAX_WORKSPACE_AVATAR_SIZE_BYTES = 1024 * 1024;
export const WORKSPACE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export const INVITE_TTL_DAYS = 7;
export const INVITE_RESEND_COOLDOWN_SECONDS = 60;
export const INVITE_TOKEN_BYTES = 32;

export const ACTIVE_WORKSPACE_COOKIE_NAME = "active_workspace";
export const PENDING_INVITE_COOKIE_NAME = "pending_invite";
export const ACTIVE_WORKSPACE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const PENDING_INVITE_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

export const WORKSPACE_MEMBER_ROLE_VALUES = ["owner", "member"] as const;
export const WORKSPACE_INVITABLE_ROLE_VALUES = ["member"] as const;
