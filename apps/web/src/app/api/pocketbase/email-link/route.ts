import { NextRequest, NextResponse } from "next/server";
import { SIGN_IN_PATH } from "@/config/routes";
import { getPathname, type AppPathname } from "@/i18n/navigation";
import { LOCALE_COOKIE_NAME, routing } from "@/i18n/routing";
import { authConfig, type AuthEmailLinkAction } from "@/config/auth";

type AppLocale = (typeof routing.locales)[number];

export async function GET(request: NextRequest) {
  const locale = resolveLocale(request);
  const action = parseEmailLinkAction(request.nextUrl.searchParams.get("action"));
  const token = parseToken(request.nextUrl.searchParams.get("token"));
  const targetRoute: AppPathname = action
    ? authConfig.routes.emailLinkActionTargets[action]
    : SIGN_IN_PATH;
  const localizedPathname = getPathname({
    href: targetRoute,
    locale,
  });
  const redirectUrl = new URL(localizedPathname, request.nextUrl.origin);

  if (action && token) {
    redirectUrl.searchParams.set("token", token);
  }

  return NextResponse.redirect(redirectUrl);
}

function parseEmailLinkAction(value: string | null): AuthEmailLinkAction | null {
  if (
    value &&
    Object.prototype.hasOwnProperty.call(authConfig.routes.emailLinkActionTargets, value)
  ) {
    return value as AuthEmailLinkAction;
  }

  return null;
}

function parseToken(value: string | null) {
  if (!value) {
    return null;
  }

  const token = value.trim();

  return token.length > 0 ? token : null;
}

function resolveLocale(request: NextRequest): AppLocale {
  const localeFromCookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;

  if (isAppLocale(localeFromCookie)) {
    return localeFromCookie;
  }

  const localeFromAcceptLanguage = resolveLocaleFromAcceptLanguage(
    request.headers.get("accept-language")
  );

  if (localeFromAcceptLanguage) {
    return localeFromAcceptLanguage;
  }

  return routing.defaultLocale;
}

function resolveLocaleFromAcceptLanguage(value: string | null): AppLocale | null {
  if (!value) {
    return null;
  }

  const languagePreferences = value
    .split(",")
    .map((part) => part.split(";")[0]?.trim().toLowerCase())
    .filter(Boolean);

  for (const languagePreference of languagePreferences) {
    if (isAppLocale(languagePreference)) {
      return languagePreference;
    }

    const baseLanguage = languagePreference.split("-")[0];

    if (isAppLocale(baseLanguage)) {
      return baseLanguage;
    }
  }

  return null;
}

function isAppLocale(value: string | null | undefined): value is AppLocale {
  if (!value) {
    return false;
  }

  return routing.locales.includes(value as AppLocale);
}
