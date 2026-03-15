import PocketBase, { cookieSerialize, type SendOptions, type SerializeOptions } from "pocketbase";
import { cookies } from "next/headers";
import {
  AUTH_PERSIST_COOKIE_MAX_AGE_SECONDS,
  PB_AUTH_COOKIE_NAME,
  PB_AUTH_PERSIST_COOKIE_NAME,
} from "@/config/auth";

export type CreatePocketBaseServerClientResult = {
  pb: PocketBase;
  hasAuthCookie: boolean;
  hadInvalidAuthCookie: boolean;
  shouldPersistSession: boolean;
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
  const persistSessionCookieValue = cookieStore.get(PB_AUTH_PERSIST_COOKIE_NAME)?.value ?? "";

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
    shouldPersistSession: persistSessionCookieValue === "1",
  };
}

export function exportPocketBaseAuthCookies(
  pb: PocketBase,
  options: ExportPocketBaseAuthCookieOptions = {}
): string[] {
  const sessionOnly = options.sessionOnly === true;

  return [
    pb.authStore.exportToCookie(
      getPocketBaseAuthCookieOptions({ sessionOnly }),
      PB_AUTH_COOKIE_NAME
    ),
    createPersistSessionCookie({ sessionOnly }),
  ];
}

export function createClearedPocketBaseAuthCookies(): string[] {
  const pb = new PocketBase(getPocketBaseUrl());
  pb.authStore.clear();

  return [
    pb.authStore.exportToCookie(
      getPocketBaseAuthCookieOptions({ sessionOnly: false }),
      PB_AUTH_COOKIE_NAME
    ),
    createClearedPersistSessionCookie(),
  ];
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
  const cookieOptions = getBaseCookieOptions();

  if (options.sessionOnly) {
    return {
      ...cookieOptions,
      expires: undefined,
      maxAge: undefined,
    };
  }

  return cookieOptions;
}

function createPersistSessionCookie(options: { sessionOnly: boolean }) {
  const cookieOptions = getBaseCookieOptions();

  if (!options.sessionOnly) {
    cookieOptions.maxAge = AUTH_PERSIST_COOKIE_MAX_AGE_SECONDS;
  }

  return cookieSerialize(
    PB_AUTH_PERSIST_COOKIE_NAME,
    options.sessionOnly ? "0" : "1",
    cookieOptions
  );
}

function createClearedPersistSessionCookie() {
  return cookieSerialize(PB_AUTH_PERSIST_COOKIE_NAME, "", {
    ...getBaseCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}

function getBaseCookieOptions(): SerializeOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  };
}

function getPocketBaseUrl() {
  const pocketBaseUrl = process.env.NEXT_PUBLIC_PB_URL;

  if (!pocketBaseUrl) {
    throw new Error("Missing NEXT_PUBLIC_PB_URL environment variable.");
  }

  return pocketBaseUrl;
}
