import { createHash, randomBytes } from "node:crypto";
import { INVITE_TOKEN_BYTES, INVITE_TTL_DAYS } from "@/server/workspaces/workspace-constants";

export function hashInviteToken(inviteToken: string): string {
  return createHash("sha256").update(inviteToken).digest("hex");
}

export function createInviteToken(): string {
  return randomBytes(INVITE_TOKEN_BYTES).toString("hex");
}

export function createInviteExpiryDate(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);

  return expiresAt.toISOString();
}

export function isDateStringExpired(value: string, now = Date.now()): boolean {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return true;
  }

  return timestamp <= now;
}
