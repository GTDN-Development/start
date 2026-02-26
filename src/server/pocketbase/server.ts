import PocketBase from "pocketbase";
import type { SerializeOptions } from "pocketbase";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const POCKETBASE_AUTH_COOKIE_NAME = "pb_auth";

type PocketBaseAuthCookieClient = {
  authStore: {
    exportToCookie(options?: SerializeOptions, key?: string): string;
  };
};

type CreateServerPocketBaseClientOptions = {
  refreshAuth?: boolean;
};

export function createPocketBaseClient() {
  return new PocketBase(getPocketBaseUrl());
}

export function loadPocketBaseAuthFromCookieHeader(
  pb: PocketBase,
  cookieHeader: string | null | undefined
) {
  const headerValue = typeof cookieHeader === "string" ? cookieHeader : "";

  if (!headerValue) {
    pb.authStore.clear();
    return false;
  }

  pb.authStore.loadFromCookie(headerValue, POCKETBASE_AUTH_COOKIE_NAME);

  if (!pb.authStore.isValid) {
    pb.authStore.clear();
    return false;
  }

  return true;
}

export async function createServerPocketBaseClient(
  options: CreateServerPocketBaseClientOptions = {}
) {
  const pb = createPocketBaseClient();
  const cookieStore = await cookies();

  if (!loadPocketBaseAuthFromCookieHeader(pb, cookieStore.toString())) {
    return pb;
  }

  if (options.refreshAuth) {
    try {
      await pb.collection("users").authRefresh();
    } catch (error) {
      console.error("PocketBase auth refresh failed:", error);
      pb.authStore.clear();
    }
  }

  return pb;
}

export function setPocketBaseAuthCookie(
  response: NextResponse,
  pb: PocketBase,
  options: { rememberMe?: boolean } = {}
) {
  response.headers.append("set-cookie", exportPocketBaseAuthCookie(pb, options));
}

export function clearPocketBaseAuthCookie(response: NextResponse) {
  response.headers.append("set-cookie", getClearedPocketBaseAuthCookie());
}

export function getPocketBaseUrl() {
  const url = process.env.NEXT_PUBLIC_PB_URL;

  if (!url) {
    throw new Error("Missing PocketBase URL. Set NEXT_PUBLIC_PB_URL.");
  }

  return url;
}

export function exportPocketBaseAuthCookie(
  pb: PocketBaseAuthCookieClient,
  options: { rememberMe?: boolean } = {}
) {
  return pb.authStore.exportToCookie(
    getPocketBaseAuthCookieOptions(options.rememberMe ?? false),
    POCKETBASE_AUTH_COOKIE_NAME
  );
}

export function getClearedPocketBaseAuthCookie() {
  return `${POCKETBASE_AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
    process.env.NODE_ENV === "production" ? "; Secure" : ""
  }`;
}

export function getPocketBaseAuthCookieOptions(rememberMe: boolean): SerializeOptions {
  if (rememberMe) {
    return {
      path: "/",
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
    };
  }

  return {
    path: "/",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: undefined,
    expires: undefined,
  };
}
