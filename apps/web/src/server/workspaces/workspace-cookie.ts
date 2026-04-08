import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { workspaceConfig } from "@/config/workspace";
import { getBaseServerCookieOptions } from "@/server/cookies";

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
  cookieStore.set(createActiveWorkspaceSlugCookie(workspaceSlug));
}

export async function clearActiveWorkspaceSlugCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(createClearedCookie(ACTIVE_WORKSPACE_COOKIE_NAME));
}

export async function getPendingInviteTokenCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(PENDING_INVITE_COOKIE_NAME)?.value ?? "";

  return normalizeCookieToken(value);
}

export async function clearPendingInviteTokenCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(createClearedCookie(PENDING_INVITE_COOKIE_NAME));
}

export function setActiveWorkspaceSlugResponseCookie(
  response: NextResponse,
  workspaceSlug: string
): void {
  response.cookies.set(createActiveWorkspaceSlugCookie(workspaceSlug));
}

export function clearPendingInviteTokenResponseCookie(response: NextResponse): void {
  response.cookies.set(createClearedCookie(PENDING_INVITE_COOKIE_NAME));
}

export function setPendingInviteTokenResponseCookie(
  response: NextResponse,
  inviteToken: string
): void {
  response.cookies.set(createPendingInviteTokenCookie(inviteToken));
}

function createActiveWorkspaceSlugCookie(workspaceSlug: string) {
  return {
    name: ACTIVE_WORKSPACE_COOKIE_NAME,
    value: workspaceSlug,
    maxAge: ACTIVE_WORKSPACE_COOKIE_MAX_AGE_SECONDS,
    ...getBaseServerCookieOptions(),
  };
}

function createPendingInviteTokenCookie(inviteToken: string) {
  return {
    name: PENDING_INVITE_COOKIE_NAME,
    value: inviteToken,
    maxAge: PENDING_INVITE_COOKIE_MAX_AGE_SECONDS,
    ...getBaseServerCookieOptions(),
  };
}

function createClearedCookie(name: string) {
  return {
    name,
    value: "",
    maxAge: 0,
    expires: new Date(0),
    ...getBaseServerCookieOptions(),
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
