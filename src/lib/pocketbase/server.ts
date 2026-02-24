import PocketBase from "pocketbase";
import type { SerializeOptions } from "pocketbase";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const POCKETBASE_AUTH_COOKIE_NAME = "pb_auth";

export function createPocketBaseClient() {
  return new PocketBase(getPocketBaseUrl());
}

export async function createServerPocketBaseClient() {
  const pb = createPocketBaseClient();
  const cookieStore = await cookies();

  pb.authStore.loadFromCookie(cookieStore.toString(), POCKETBASE_AUTH_COOKIE_NAME);

  if (!pb.authStore.isValid) {
    pb.authStore.clear();
  }

  return pb;
}

export function setPocketBaseAuthCookie(
  response: NextResponse,
  pb: PocketBase,
  options: { rememberMe?: boolean } = {}
) {
  response.headers.append(
    "set-cookie",
    pb.authStore.exportToCookie(
      getPocketBaseAuthCookieOptions(options.rememberMe ?? false),
      POCKETBASE_AUTH_COOKIE_NAME
    )
  );
}

export function clearPocketBaseAuthCookie(response: NextResponse) {
  response.headers.append(
    "set-cookie",
    `${POCKETBASE_AUTH_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
      process.env.NODE_ENV === "production" ? "; Secure" : ""
    }`
  );
}

function getPocketBaseUrl() {
  const url = process.env.NEXT_PUBLIC_POCKETBASE_URL ?? process.env.NEXT_PUBLIC_PB_URL;

  if (!url) {
    throw new Error(
      "Missing PocketBase URL. Set NEXT_PUBLIC_POCKETBASE_URL (or NEXT_PUBLIC_PB_URL)."
    );
  }

  return url;
}

function getPocketBaseAuthCookieOptions(rememberMe: boolean): SerializeOptions {
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
