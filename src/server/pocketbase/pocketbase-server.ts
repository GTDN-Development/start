import PocketBase, { type SendOptions, type SerializeOptions } from "pocketbase";
import { cookies } from "next/headers";
import { PB_AUTH_COOKIE_NAME } from "@/features/auth/auth-cookie";

export type CreatePocketBaseServerClientResult = {
  pb: PocketBase;
  hasAuthCookie: boolean;
  hadInvalidAuthCookie: boolean;
};

type ExportPocketBaseAuthCookieOptions = {
  sessionOnly?: boolean;
};

export async function createPocketBaseServerClient(): Promise<CreatePocketBaseServerClientResult> {
  const pb = new PocketBase(getPocketBaseUrl());

  pb.autoCancellation(false);
  pb.beforeSend = withNoStoreFetch;

  const cookieStore = await cookies();
  const pbAuthCookieValue = cookieStore.get(PB_AUTH_COOKIE_NAME)?.value ?? "";
  const hasAuthCookie = pbAuthCookieValue.length > 0;

  if (hasAuthCookie) {
    pb.authStore.loadFromCookie(`${PB_AUTH_COOKIE_NAME}=${pbAuthCookieValue}`, PB_AUTH_COOKIE_NAME);
  }

  const hadInvalidAuthCookie = hasAuthCookie && !pb.authStore.isValid;

  if (hadInvalidAuthCookie) {
    pb.authStore.clear();
  }

  return {
    pb,
    hasAuthCookie,
    hadInvalidAuthCookie,
  };
}

export function exportPocketBaseAuthCookie(
  pb: PocketBase,
  options: ExportPocketBaseAuthCookieOptions = {}
): string {
  return pb.authStore.exportToCookie(getPocketBaseAuthCookieOptions(options), PB_AUTH_COOKIE_NAME);
}

export function createClearedPocketBaseAuthCookie(): string {
  const pb = new PocketBase(getPocketBaseUrl());
  pb.authStore.clear();

  return exportPocketBaseAuthCookie(pb);
}

function withNoStoreFetch(url: string, options: SendOptions) {
  return {
    url,
    options: {
      ...options,
      cache: "no-store",
    },
  };
}

function getPocketBaseAuthCookieOptions(
  options: ExportPocketBaseAuthCookieOptions
): SerializeOptions {
  const cookieOptions: SerializeOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };

  if (options.sessionOnly) {
    return {
      ...cookieOptions,
      expires: undefined,
      maxAge: undefined,
    };
  }

  return cookieOptions;
}

function getPocketBaseUrl() {
  const pocketBaseUrl = process.env.NEXT_PUBLIC_PB_URL;

  if (!pocketBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_PB_URL environment variable.");
  }

  return pocketBaseUrl;
}
