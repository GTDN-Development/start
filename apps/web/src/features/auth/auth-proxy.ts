import { NextRequest } from "next/server";
import { AUTH_PROTECTED_ROUTE_PREFIXES, AUTH_REDIRECTS } from "@/config/auth";
import { authConfig } from "@/config/auth";
import { securityConfig } from "@/config/security";
import { routing } from "@/i18n/routing";

type AppLocale = (typeof routing.locales)[number];

type AuthGuardRedirect = {
  shouldRedirect: true;
  pathname: string;
};

type AuthGuardPass = {
  shouldRedirect: false;
};

export type AuthProxyGuardResult = AuthGuardRedirect | AuthGuardPass;

export function evaluateAuthProxyGuard(request: NextRequest): AuthProxyGuardResult {
  const locale = resolveLocaleFromPathname(request.nextUrl.pathname);
  const pathnameWithoutLocale = stripLocalePrefix(request.nextUrl.pathname, locale);
  const hasRequiredAuthCookies = hasProtectedRouteAuthCookies(request);

  if (
    !hasRequiredAuthCookies &&
    isRouteMatched(pathnameWithoutLocale, AUTH_PROTECTED_ROUTE_PREFIXES, locale)
  ) {
    return {
      shouldRedirect: true,
      pathname: `/${locale}${getLocalizedRoutePath(AUTH_REDIRECTS.unauthenticatedTo, locale)}`,
    };
  }

  return {
    shouldRedirect: false,
  };
}

function hasProtectedRouteAuthCookies(request: NextRequest) {
  const authCookieValue = request.cookies.get(authConfig.cookies.authCookieName)?.value ?? "";
  const deviceCookieValue =
    request.cookies.get(securityConfig.deviceSessions.cookieName)?.value ?? "";

  return authCookieValue.trim().length > 0 && deviceCookieValue.trim().length > 0;
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
