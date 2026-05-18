import { cookies } from "next/headers";
import { Buffer } from "node:buffer";
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

type AuthTokenPayload = {
  exp?: unknown;
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
  const cookieOptions = getPocketBaseAuthCookieOptions(pb, options);
  const exportedCookie = pb.authStore.exportToCookie(
    cookieOptions,
    authConfig.cookies.authCookieName
  );

  return {
    name: authConfig.cookies.authCookieName,
    value: cookieParse(exportedCookie)[authConfig.cookies.authCookieName] ?? "",
    ...cookieOptions,
  };
}

function getPocketBaseAuthCookieOptions(
  pb: PocketBase,
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

  return {
    ...cookieOptions,
    expires: getAuthTokenExpiryDate(pb.authStore.token),
  };
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

function getAuthTokenExpiryDate(token: string): Date {
  const payload = getAuthTokenPayload(token);
  const expiresAtSeconds = payload?.exp;

  if (typeof expiresAtSeconds !== "number" || !Number.isFinite(expiresAtSeconds)) {
    return new Date(0);
  }

  return new Date(expiresAtSeconds * 1000);
}

function getAuthTokenPayload(token: string): AuthTokenPayload | null {
  const payloadSegment = token.split(".")[1];

  if (!payloadSegment) {
    return null;
  }

  try {
    const payload: unknown = JSON.parse(Buffer.from(payloadSegment, "base64url").toString("utf8"));

    if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
