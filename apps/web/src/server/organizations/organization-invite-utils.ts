import { createHash, randomBytes } from "node:crypto";
import { organizationConfig } from "@/config/organization";

export function hashInviteToken(inviteToken: string): string {
  return createHash("sha256").update(inviteToken).digest("hex");
}

export function createInviteToken(): string {
  return randomBytes(organizationConfig.invites.tokenBytes).toString("hex");
}

export function createInviteExpiryDate(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + organizationConfig.invites.ttlDays);

  return expiresAt.toISOString();
}

export function isDateStringExpired(value: string, now = Date.now()): boolean {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return true;
  }

  return timestamp <= now;
}
