import { cookies } from "next/headers";
import { workspaceConfig } from "@/config/workspace";

const ACTIVE_WORKSPACE_COOKIE_NAME = workspaceConfig.cookies.activeWorkspace.name;
const ACTIVE_WORKSPACE_COOKIE_MAX_AGE_SECONDS = workspaceConfig.cookies.activeWorkspace.maxAgeSeconds;
const PENDING_INVITE_COOKIE_NAME = workspaceConfig.cookies.pendingInvite.name;
const PENDING_INVITE_COOKIE_MAX_AGE_SECONDS = workspaceConfig.cookies.pendingInvite.maxAgeSeconds;

export async function getActiveWorkspaceSlugCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ACTIVE_WORKSPACE_COOKIE_NAME)?.value ?? "";

  return normalizeCookieToken(value);
}

export async function setActiveWorkspaceSlugCookie(workspaceSlug: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set({
    name: ACTIVE_WORKSPACE_COOKIE_NAME,
    value: workspaceSlug,
    maxAge: ACTIVE_WORKSPACE_COOKIE_MAX_AGE_SECONDS,
    ...getBaseCookieOptions(),
  });
}

export async function clearActiveWorkspaceSlugCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ACTIVE_WORKSPACE_COOKIE_NAME);
}

export async function getPendingInviteHashCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(PENDING_INVITE_COOKIE_NAME)?.value ?? "";

  return normalizeCookieToken(value);
}

export async function setPendingInviteHashCookie(inviteHash: string): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set({
    name: PENDING_INVITE_COOKIE_NAME,
    value: inviteHash,
    maxAge: PENDING_INVITE_COOKIE_MAX_AGE_SECONDS,
    ...getBaseCookieOptions(),
  });
}

export async function clearPendingInviteHashCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(PENDING_INVITE_COOKIE_NAME);
}

function getBaseCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
}

function normalizeCookieToken(value: string): string | null {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.startsWith("[") && normalizedValue.endsWith("]")) {
    return null;
  }

  return normalizedValue;
}
