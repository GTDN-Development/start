import PocketBase from "pocketbase";
import type { AuthSession } from "@/features/auth/auth-types";
import type { UsersRecord } from "@/types/pocketbase";
import { getAvatarUrl, getNullableTrimmedString } from "@/server/pocketbase/pocketbase-utils";

export function createAuthSession(pb: PocketBase, record: UsersRecord | null): AuthSession | null {
  if (!record) {
    return null;
  }

  return {
    user: {
      id: record.id,
      email: record.email,
      name: getNullableTrimmedString(record.name),
      avatarUrl: getAvatarUrl(pb, record),
    },
  };
}

export function createDisplayName(firstName: string, lastName: string) {
  return `${firstName} ${lastName}`.trim();
}

export function isProbablyConsumedVerificationToken(token: string): boolean {
  const payload = parseJwtPayload(token);

  if (!payload || payload.type !== "verification" || typeof payload.email !== "string") {
    return false;
  }

  if (typeof payload.exp === "number" && payload.exp * 1000 <= Date.now()) {
    return false;
  }

  return payload.email.trim().length > 0;
}

function parseJwtPayload(token: string): Record<string, unknown> | null {
  const segments = token.split(".");

  if (segments.length !== 3 || !segments[1]) {
    return null;
  }

  try {
    const base64 = segments[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalizedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const payload = JSON.parse(Buffer.from(normalizedBase64, "base64").toString("utf8"));

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }

    return payload as Record<string, unknown>;
  } catch {
    return null;
  }
}
