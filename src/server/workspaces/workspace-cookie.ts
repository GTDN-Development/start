import { cookies } from "next/headers";
import { workspaceConfig } from "@/config/workspace";
import {
  getBaseServerCookieOptions,
  isReadonlyRequestCookiesError,
} from "@/server/cookies";

const ACTIVE_WORKSPACE_COOKIE_NAME = workspaceConfig.cookies.activeWorkspace.name;
const ACTIVE_WORKSPACE_COOKIE_MAX_AGE_SECONDS =
  workspaceConfig.cookies.activeWorkspace.maxAgeSeconds;
const PENDING_INVITE_COOKIE_NAME = workspaceConfig.cookies.pendingInvite.name;
const PENDING_INVITE_COOKIE_MAX_AGE_SECONDS = workspaceConfig.cookies.pendingInvite.maxAgeSeconds;

export async function getActiveWorkspaceSlugCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ACTIVE_WORKSPACE_COOKIE_NAME)?.value ?? "";

  return normalizeCookieToken(value);
}

export async function setActiveWorkspaceSlugCookie(workspaceSlug: string): Promise<void> {
  const cookieStore = await cookies();

  try {
    cookieStore.set({
      name: ACTIVE_WORKSPACE_COOKIE_NAME,
      value: workspaceSlug,
      maxAge: ACTIVE_WORKSPACE_COOKIE_MAX_AGE_SECONDS,
      ...getBaseCookieOptions(),
    });
  } catch (error) {
    if (isReadonlyRequestCookiesError(error)) {
      return;
    }

    throw error;
  }
}

export async function clearActiveWorkspaceSlugCookie(): Promise<void> {
  const cookieStore = await cookies();

  try {
    cookieStore.delete(ACTIVE_WORKSPACE_COOKIE_NAME);
  } catch (error) {
    if (isReadonlyRequestCookiesError(error)) {
      return;
    }

    throw error;
  }
}

export async function getPendingInviteTokenCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(PENDING_INVITE_COOKIE_NAME)?.value ?? "";

  return normalizeCookieToken(value);
}

export async function setPendingInviteTokenCookie(inviteToken: string): Promise<void> {
  const cookieStore = await cookies();

  try {
    cookieStore.set({
      name: PENDING_INVITE_COOKIE_NAME,
      value: inviteToken,
      maxAge: PENDING_INVITE_COOKIE_MAX_AGE_SECONDS,
      ...getBaseCookieOptions(),
    });
  } catch (error) {
    if (isReadonlyRequestCookiesError(error)) {
      return;
    }

    throw error;
  }
}

export async function clearPendingInviteTokenCookie(): Promise<void> {
  const cookieStore = await cookies();

  try {
    cookieStore.delete(PENDING_INVITE_COOKIE_NAME);
  } catch (error) {
    if (isReadonlyRequestCookiesError(error)) {
      return;
    }

    throw error;
  }
}

export async function consumePendingInviteTokenCookie(): Promise<string | null> {
  const inviteToken = await getPendingInviteTokenCookie();

  if (!inviteToken) {
    return null;
  }

  await clearPendingInviteTokenCookie();

  return inviteToken;
}

function getBaseCookieOptions() {
  return getBaseServerCookieOptions();
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
