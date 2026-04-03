import { createHash, randomBytes } from "node:crypto";
import { workspaceConfig } from "@/config/workspace";

export function hashInviteToken(inviteToken: string): string {
  return createHash("sha256").update(inviteToken).digest("hex");
}

export function createInviteToken(): string {
  return randomBytes(workspaceConfig.invites.tokenBytes).toString("hex");
}

export function createInviteExpiryDate(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + workspaceConfig.invites.ttlDays);

  return expiresAt.toISOString();
}

export function isDateStringExpired(value: string, now = Date.now()): boolean {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return true;
  }

  return timestamp <= now;
}
