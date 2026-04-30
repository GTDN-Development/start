import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { AUTH_PROTECTED_ROUTE_PREFIXES, AUTH_REDIRECTS, authConfig } from "@/config/auth";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);
type AppLocale = (typeof routing.locales)[number];

type AuthProxyGuardResult =
  | {
      shouldRedirect: true;
      pathname: string;
    }
  | {
      shouldRedirect: false;
    };

export default function proxy(request: NextRequest) {
  const authGuardResult = evaluateAuthProxyGuard(request);

  if (authGuardResult.shouldRedirect) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = authGuardResult.pathname;
    redirectUrl.search = "";

    return NextResponse.redirect(redirectUrl);
  }

  return intlMiddleware(request);
}

export function evaluateAuthProxyGuard(request: NextRequest): AuthProxyGuardResult {
  const locale = resolveLocaleFromPathname(request.nextUrl.pathname);
  const pathname = stripLocalePrefix(request.nextUrl.pathname, locale);
  const authCookieValue = request.cookies.get(authConfig.cookies.authCookieName)?.value ?? "";

  if (authCookieValue.trim() || !isProtectedRoute(pathname, locale)) {
    return {
      shouldRedirect: false,
    };
  }

  return {
    shouldRedirect: true,
    pathname: `/${locale}${getLocalizedRoutePath(AUTH_REDIRECTS.unauthenticatedTo, locale)}`,
  };
}

function resolveLocaleFromPathname(pathname: string): AppLocale {
  const localeSegment = pathname.split("/")[1] ?? "";

  return routing.locales.includes(localeSegment as AppLocale)
    ? (localeSegment as AppLocale)
    : routing.defaultLocale;
}

function stripLocalePrefix(pathname: string, locale: AppLocale) {
  const localePrefix = `/${locale}`;
  const withoutLocale = pathname.startsWith(localePrefix)
    ? pathname.slice(localePrefix.length)
    : pathname;

  return withoutLocale || "/";
}

function isProtectedRoute(pathname: string, locale: AppLocale) {
  return AUTH_PROTECTED_ROUTE_PREFIXES.some((routeKey) => {
    const localizedRoute = getLocalizedRoutePath(routeKey, locale);

    return isPathnameOrSubpath(pathname, routeKey) || isPathnameOrSubpath(pathname, localizedRoute);
  });
}

function getLocalizedRoutePath(routeKey: string, locale: AppLocale) {
  const localized = (
    routing.pathnames as Record<string, string | Partial<Record<AppLocale, string>>>
  )[routeKey];

  return typeof localized === "object" ? (localized[locale] ?? routeKey) : (localized ?? routeKey);
}

function isPathnameOrSubpath(pathname: string, routePath: string) {
  return pathname === routePath || pathname.startsWith(`${routePath}/`);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
