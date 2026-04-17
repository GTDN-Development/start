import { cookies } from "next/headers";
import PocketBase, { cookieSerialize, type SendOptions, type SerializeOptions } from "pocketbase";
import { authConfig } from "@/config/auth";
import { getPocketBaseUrl } from "@/config/public-env";
import { getBaseServerCookieOptions } from "@/server/cookies";

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

export function exportPocketBaseAuthCookies(
  pb: PocketBase,
  options: ExportPocketBaseAuthCookieOptions = {}
): string[] {
  const sessionOnly = options.sessionOnly === true;

  return [
    pb.authStore.exportToCookie(
      getPocketBaseAuthCookieOptions({ sessionOnly }),
      authConfig.cookies.authCookieName
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
      authConfig.cookies.authCookieName
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

function createPersistSessionCookie(options: { sessionOnly: boolean }) {
  const cookieOptions: SerializeOptions = getBaseServerCookieOptions();

  if (!options.sessionOnly) {
    cookieOptions.maxAge = authConfig.cookies.persistCookieMaxAgeSeconds;
  }

  return cookieSerialize(
    authConfig.cookies.persistCookieName,
    options.sessionOnly ? "0" : "1",
    cookieOptions
  );
}

function createClearedPersistSessionCookie() {
  return cookieSerialize(authConfig.cookies.persistCookieName, "", {
    ...getBaseServerCookieOptions(),
    maxAge: 0,
    expires: new Date(0),
  });
}
