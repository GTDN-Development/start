import { randomBytes } from "node:crypto";
import { cookieSerialize, type SerializeOptions } from "pocketbase";
import { getBaseServerCookieOptions } from "@/server/cookies";
import { cookies } from "next/headers";
import { createClearedPocketBaseAuthCookies } from "@/server/pocketbase/pocketbase-server";
import {
  DEVICE_SESSION_COOKIE_NAME,
  DEVICE_SESSION_PERSISTENT_MAX_AGE_SECONDS,
} from "@/server/device-sessions/device-sessions-types";

export function generateDeviceSessionCookie(rememberMe: boolean): {
  token: string;
  setCookie: string;
} {
  const token = randomBytes(32).toString("hex");
  const setCookie = cookieSerialize(
    DEVICE_SESSION_COOKIE_NAME,
    token,
    getDeviceCookieOptions(rememberMe)
  );

  return {
    token,
    setCookie,
  };
}

export async function readDeviceSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(DEVICE_SESSION_COOKIE_NAME)?.value ?? null;
}

export function createClearedDeviceSessionCookie(): string {
  return cookieSerialize(DEVICE_SESSION_COOKIE_NAME, "", {
    ...getBaseCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}

export function createClearedAuthAndDeviceCookies(): string[] {
  return [...createClearedPocketBaseAuthCookies(), createClearedDeviceSessionCookie()];
}

function getDeviceCookieOptions(rememberMe: boolean): SerializeOptions {
  const baseOptions = getBaseCookieOptions();

  if (!rememberMe) {
    return {
      ...baseOptions,
      maxAge: undefined,
      expires: undefined,
    };
  }

  return {
    ...baseOptions,
    maxAge: DEVICE_SESSION_PERSISTENT_MAX_AGE_SECONDS,
  };
}

function getBaseCookieOptions(): SerializeOptions {
  return getBaseServerCookieOptions();
}
