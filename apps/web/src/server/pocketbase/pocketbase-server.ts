import { cookies } from "next/headers";
import PocketBase, { cookieParse, type SendOptions } from "pocketbase";
import { authConfig } from "@/config/auth";
import { getPocketBaseUrl } from "@/config/public-env";
import type { AuthCookieMutation } from "@/server/auth/auth-cookies";
import { getBaseServerCookieOptions, type ServerCookieOptions } from "@/server/cookies";

export type CreatePocketBaseServerClientResult = {
  authCookieState: "missing" | "present" | "invalid";
  pb: PocketBase;
  shouldPersistSession: boolean;
};

type ExportPocketBaseAuthCookieOptions = {
  sessionOnly?: boolean;
};

export async function createPocketBaseServerClient(): Promise<CreatePocketBaseServerClientResult> {
  const pb = createPocketBaseClient();

  const cookieStore = await cookies();
  const pbAuthCookieValue = cookieStore.get(authConfig.cookies.authCookieName)?.value ?? "";
  const persistSessionCookieValue =
    cookieStore.get(authConfig.cookies.persistCookieName)?.value ?? "";

  const hasAuthCookie = pbAuthCookieValue.length > 0;

  if (hasAuthCookie) {
    pb.authStore.loadFromCookie(
      `${authConfig.cookies.authCookieName}=${pbAuthCookieValue}`,
      authConfig.cookies.authCookieName
    );
  }

  const authCookieState = !hasAuthCookie ? "missing" : pb.authStore.isValid ? "present" : "invalid";

  if (authCookieState === "invalid") {
    pb.authStore.clear();
  }

  return {
    authCookieState,
    pb,
    shouldPersistSession: persistSessionCookieValue === "1",
  };
}

export function createPocketBaseClient(): PocketBase {
  const pb = new PocketBase(getPocketBaseUrl());

  pb.autoCancellation(false);
  pb.beforeSend = withNoStoreFetch;

  return pb;
}

export function createPocketBaseAuthCookieMutations(
  pb: PocketBase,
  options: ExportPocketBaseAuthCookieOptions = {}
): AuthCookieMutation[] {
  const sessionOnly = options.sessionOnly === true;

  return [
    createPocketBaseAuthCookieMutation(pb, { sessionOnly }),
    createPersistSessionCookie({ sessionOnly }),
  ];
}

export function createClearedPocketBaseAuthCookieMutations(): AuthCookieMutation[] {
  return [
    createClearedCookie(authConfig.cookies.authCookieName),
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

function createPocketBaseAuthCookieMutation(
  pb: PocketBase,
  options: ExportPocketBaseAuthCookieOptions
): AuthCookieMutation {
  const exportedCookie = pb.authStore.exportToCookie(
    getPocketBaseAuthCookieOptions(options),
    authConfig.cookies.authCookieName
  );

  return {
    name: authConfig.cookies.authCookieName,
    value: cookieParse(exportedCookie)[authConfig.cookies.authCookieName] ?? "",
    ...getPocketBaseAuthCookieOptions(options),
  };
}

function getPocketBaseAuthCookieOptions(
  options: ExportPocketBaseAuthCookieOptions
): ServerCookieOptions {
  const cookieOptions = getBaseServerCookieOptions();

  if (options.sessionOnly) {
    return {
      ...cookieOptions,
      expires: undefined,
      maxAge: undefined,
    };
  }

  return cookieOptions;
}

function createPersistSessionCookie(options: { sessionOnly: boolean }): AuthCookieMutation {
  const cookieOptions = getBaseServerCookieOptions();

  if (!options.sessionOnly) {
    cookieOptions.maxAge = authConfig.cookies.persistCookieMaxAgeSeconds;
  }

  return {
    name: authConfig.cookies.persistCookieName,
    value: options.sessionOnly ? "0" : "1",
    ...cookieOptions,
  };
}

function createClearedPersistSessionCookie(): AuthCookieMutation {
  return createClearedCookie(authConfig.cookies.persistCookieName);
}

function createClearedCookie(name: string): AuthCookieMutation {
  return {
    name,
    value: "",
    ...getBaseServerCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  };
}
