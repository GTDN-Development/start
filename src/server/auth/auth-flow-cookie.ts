import { Buffer } from "node:buffer";
import { cookies } from "next/headers";
import { authConfig } from "@/config/auth";
import { getBaseServerCookieOptions } from "@/server/cookies";

type EmailChangeFlowCookiePayload = {
  userId: string;
  nextEmail: string;
  persistSession: boolean;
};

const EMAIL_CHANGE_FLOW_COOKIE_NAME = authConfig.cookies.emailChangeFlowCookieName;
const EMAIL_CHANGE_FLOW_COOKIE_MAX_AGE_SECONDS =
  authConfig.cookies.emailChangeFlowCookieMaxAgeSeconds;

export async function readEmailChangeFlowCookie(): Promise<EmailChangeFlowCookiePayload | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(EMAIL_CHANGE_FLOW_COOKIE_NAME)?.value ?? "";

  if (!value.trim()) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(Buffer.from(value, "base64url").toString("utf8")) as {
      userId?: unknown;
      nextEmail?: unknown;
      persistSession?: unknown;
    };

    if (
      typeof parsedValue.userId !== "string" ||
      typeof parsedValue.nextEmail !== "string" ||
      typeof parsedValue.persistSession !== "boolean"
    ) {
      return null;
    }

    const userId = parsedValue.userId.trim();
    const nextEmail = parsedValue.nextEmail.trim().toLowerCase();

    if (!userId || !nextEmail) {
      return null;
    }

    return {
      userId,
      nextEmail,
      persistSession: parsedValue.persistSession,
    };
  } catch {
    return null;
  }
}

export async function setEmailChangeFlowCookie(
  payload: EmailChangeFlowCookiePayload
): Promise<void> {
  const cookieStore = await cookies();
  const encodedValue = Buffer.from(
    JSON.stringify({
      userId: payload.userId.trim(),
      nextEmail: payload.nextEmail.trim().toLowerCase(),
      persistSession: payload.persistSession,
    }),
    "utf8"
  ).toString("base64url");

  cookieStore.set({
    name: EMAIL_CHANGE_FLOW_COOKIE_NAME,
    value: encodedValue,
    maxAge: EMAIL_CHANGE_FLOW_COOKIE_MAX_AGE_SECONDS,
    ...getBaseServerCookieOptions(),
  });
}

export async function clearEmailChangeFlowCookie(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(EMAIL_CHANGE_FLOW_COOKIE_NAME);
}
