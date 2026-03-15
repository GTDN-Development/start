import { workspaceConfig } from "@/config/workspace";

export const MAX_WORKSPACE_NAME_LENGTH: number = workspaceConfig.limits.nameMaxLength;
export const MAX_WORKSPACE_SLUG_LENGTH: number = workspaceConfig.limits.slugMaxLength;
export const INVITE_TTL_DAYS: number = workspaceConfig.invites.ttlDays;
export const INVITE_RESEND_COOLDOWN_SECONDS: number = workspaceConfig.invites.resendCooldownSeconds;
export const INVITE_TOKEN_BYTES: number = workspaceConfig.invites.tokenBytes;
