import PocketBase from "pocketbase";
import { headers } from "next/headers";
import type { AuthSession } from "@/features/auth/auth-contract";
import type { UsersRecord } from "@/types/pocketbase";
import {
  createDeviceSessionCookie,
  generateDeviceSessionCookie,
} from "@/server/device-sessions/device-sessions-cookie";
import { registerOrRefreshDeviceSession } from "@/server/device-sessions/device-sessions-service";
import {
  formatServiceError,
  getAvatarUrl,
  getNullableTrimmedString,
} from "@/server/pocketbase/pocketbase-utils";
import { exportPocketBaseAuthCookies } from "@/server/pocketbase/pocketbase-server";

export async function createAuthAndDeviceCookies(input: {
  pb: PocketBase;
  userId: string;
  rememberMe: boolean;
  existingDeviceSessionToken?: string | null;
  logContext: string;
}): Promise<string[]> {
  const normalizedExistingDeviceSessionToken = input.existingDeviceSessionToken?.trim() ?? "";
  const nextDeviceSession =
    normalizedExistingDeviceSessionToken.length > 0
      ? {
          token: normalizedExistingDeviceSessionToken,
          setCookie: createDeviceSessionCookie(
            normalizedExistingDeviceSessionToken,
            input.rememberMe
          ),
        }
      : generateDeviceSessionCookie(input.rememberMe);

  try {
    const requestHeaders = await headers();

    await registerOrRefreshDeviceSession({
      pb: input.pb,
      userId: input.userId,
      sessionToken: nextDeviceSession.token,
      rememberMe: input.rememberMe,
      requestHeaders,
    });
  } catch (error) {
    console.warn(
      `[auth-service] ${input.logContext}: device session registration failed, continuing`,
      formatServiceError(error)
    );
  }

  return [
    ...exportPocketBaseAuthCookies(input.pb, {
      sessionOnly: !input.rememberMe,
    }),
    nextDeviceSession.setCookie,
  ];
}

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
