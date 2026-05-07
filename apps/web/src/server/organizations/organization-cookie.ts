import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { organizationConfig } from "@/config/organization";
import { getBaseServerCookieOptions } from "@/server/cookies";

const ACTIVE_ORGANIZATION_COOKIE_NAME = organizationConfig.cookies.activeOrganization.name;
const ACTIVE_ORGANIZATION_COOKIE_MAX_AGE_SECONDS =
  organizationConfig.cookies.activeOrganization.maxAgeSeconds;
const PENDING_INVITE_COOKIE_NAME = organizationConfig.cookies.pendingInvite.name;
const PENDING_INVITE_COOKIE_MAX_AGE_SECONDS =
  organizationConfig.cookies.pendingInvite.maxAgeSeconds;

export async function getActiveOrganizationSlugCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const value = cookieStore.get(ACTIVE_ORGANIZATION_COOKIE_NAME)?.value ?? "";

  return normalizeCookieToken(value);
}

export async function setActiveOrganizationSlugCookie(organizationSlug: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(createActiveOrganizationSlugCookie(organizationSlug));
}

export async function clearActiveOrganizationSlugCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(createClearedCookie(ACTIVE_ORGANIZATION_COOKIE_NAME));
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

export function setActiveOrganizationSlugResponseCookie(
  response: NextResponse,
  organizationSlug: string
): void {
  response.cookies.set(createActiveOrganizationSlugCookie(organizationSlug));
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

function createActiveOrganizationSlugCookie(organizationSlug: string) {
  return {
    name: ACTIVE_ORGANIZATION_COOKIE_NAME,
    value: organizationSlug,
    maxAge: ACTIVE_ORGANIZATION_COOKIE_MAX_AGE_SECONDS,
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

  return normalizedValue && !/^\[.*\]$/.test(normalizedValue) ? normalizedValue : null;
}
