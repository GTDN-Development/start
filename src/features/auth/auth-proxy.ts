import { NextRequest } from "next/server";
import { PB_AUTH_COOKIE_NAME } from "@/features/auth/auth-cookie";
import {
  AUTH_GUEST_ONLY_ROUTE_PREFIXES,
  AUTH_PROTECTED_ROUTE_PREFIXES,
  AUTH_REDIRECTS,
} from "@/features/auth/auth-routes";
import { routing } from "@/i18n/routing";

type AppLocale = (typeof routing.locales)[number];

type PocketBaseAuthCookieState = "missing" | "valid" | "invalid";

type AuthGuardRedirect = {
  shouldRedirect: true;
  pathname: string;
  shouldClearAuthCookies: boolean;
};

type AuthGuardPass = {
  shouldRedirect: false;
  shouldClearAuthCookies: boolean;
};

export type AuthProxyGuardResult = AuthGuardRedirect | AuthGuardPass;

export function evaluateAuthProxyGuard(request: NextRequest): AuthProxyGuardResult {
  const locale = resolveLocaleFromPathname(request.nextUrl.pathname);
  const pathnameWithoutLocale = stripLocalePrefix(request.nextUrl.pathname, locale);
  const authCookieState = getPocketBaseAuthCookieState(request);
  const hasValidAuthCookie = authCookieState === "valid";
  const shouldClearAuthCookies = authCookieState === "invalid";

  if (
    !hasValidAuthCookie &&
    isRouteMatched(pathnameWithoutLocale, AUTH_PROTECTED_ROUTE_PREFIXES, locale)
  ) {
    return {
      shouldRedirect: true,
      pathname: `/${locale}${getLocalizedRoutePath(AUTH_REDIRECTS.unauthenticatedTo, locale)}`,
      shouldClearAuthCookies,
    };
  }

  if (
    hasValidAuthCookie &&
    isRouteMatched(pathnameWithoutLocale, AUTH_GUEST_ONLY_ROUTE_PREFIXES, locale)
  ) {
    return {
      shouldRedirect: true,
      pathname: `/${locale}${getLocalizedRoutePath(AUTH_REDIRECTS.authenticatedTo, locale)}`,
      shouldClearAuthCookies,
    };
  }

  return {
    shouldRedirect: false,
    shouldClearAuthCookies,
  };
}

function getPocketBaseAuthCookieState(request: NextRequest): PocketBaseAuthCookieState {
  const cookieValue = request.cookies.get(PB_AUTH_COOKIE_NAME)?.value ?? "";

  if (cookieValue.length === 0) {
    return "missing";
  }

  return isPocketBaseAuthCookieLikelyValid(cookieValue) ? "valid" : "invalid";
}

function isPocketBaseAuthCookieLikelyValid(cookieValue: string) {
  const parsedCookiePayload = parsePocketBaseAuthCookieValue(cookieValue);
  const token = parsedCookiePayload?.token;

  if (typeof token !== "string" || token.length === 0) {
    return false;
  }

  const payload = parseJwtPayload(token);
  const expiresAt = payload?.exp;

  if (typeof expiresAt !== "number") {
    return false;
  }

  return expiresAt * 1000 > Date.now() + 10_000;
}

function parsePocketBaseAuthCookieValue(value: string): { token?: unknown } | null {
  const directParsedValue = safeParseJson(value);

  if (directParsedValue) {
    return directParsedValue;
  }

  const decodedValue = safeDecodeURIComponent(value);

  if (!decodedValue) {
    return null;
  }

  return safeParseJson(decodedValue);
}

function parseJwtPayload(token: string): { exp?: unknown } | null {
  const tokenParts = token.split(".");

  if (tokenParts.length < 2) {
    return null;
  }

  const base64Payload = tokenParts[1];
  const decodedPayload = decodeBase64Url(base64Payload);

  if (!decodedPayload) {
    return null;
  }

  return safeParseJson(decodedPayload);
}

function decodeBase64Url(value: string) {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const paddedBase64 = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");

  try {
    if (typeof atob === "function") {
      return atob(paddedBase64);
    }
  } catch {
    return null;
  }

  return null;
}

function safeParseJson(value: string): { [key: string]: unknown } | null {
  try {
    const parsed = JSON.parse(value) as unknown;

    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return null;
    }

    return parsed as { [key: string]: unknown };
  } catch {
    return null;
  }
}

function safeDecodeURIComponent(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function resolveLocaleFromPathname(pathname: string): AppLocale {
  const localeSegment = pathname.split("/")[1] ?? "";

  if (isKnownLocale(localeSegment)) {
    return localeSegment;
  }

  return routing.defaultLocale;
}

function isKnownLocale(value: string): value is AppLocale {
  return routing.locales.includes(value as AppLocale);
}

function stripLocalePrefix(pathname: string, locale: AppLocale) {
  const localePrefix = `/${locale}`;
  const withoutLocale = pathname.startsWith(localePrefix)
    ? pathname.slice(localePrefix.length)
    : pathname;

  return withoutLocale.length > 0 ? withoutLocale : "/";
}

function isRouteMatched(pathname: string, routeKeys: readonly string[], locale: AppLocale) {
  for (const routeKey of routeKeys) {
    const localizedPath = getLocalizedRoutePath(routeKey, locale);

    if (isPathnameOrSubpath(pathname, routeKey) || isPathnameOrSubpath(pathname, localizedPath)) {
      return true;
    }
  }

  return false;
}

function isPathnameOrSubpath(pathname: string, routePath: string) {
  return pathname === routePath || pathname.startsWith(`${routePath}/`);
}

function getLocalizedRoutePath(routeKey: string, locale: AppLocale) {
  const pathnames = routing.pathnames as Record<
    string,
    string | Partial<Record<AppLocale, string>>
  >;
  const localized = pathnames[routeKey];

  if (typeof localized === "string") {
    return localized;
  }

  if (localized && typeof localized === "object") {
    const mappedPath = localized[locale];

    if (typeof mappedPath === "string") {
      return mappedPath;
    }
  }

  return routeKey;
}
