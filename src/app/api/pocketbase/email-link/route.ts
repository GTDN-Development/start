import { NextRequest, NextResponse } from "next/server";
import { getPathname, type AppPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

type AppLocale = (typeof routing.locales)[number];

type EmailLinkAction = "verify-email" | "reset-password" | "confirm-email-change";

const EMAIL_LINK_ACTION_TARGETS: Record<EmailLinkAction, AppPathname> = {
  "verify-email": "/verify-email",
  "reset-password": "/reset-password",
  "confirm-email-change": "/confirm-email-change",
};

export async function GET(request: NextRequest) {
  const locale = resolveLocale(request);
  const action = parseEmailLinkAction(request.nextUrl.searchParams.get("action"));
  const token = parseToken(request.nextUrl.searchParams.get("token"));
  const targetRoute: AppPathname = action ? EMAIL_LINK_ACTION_TARGETS[action] : "/login";
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

function parseEmailLinkAction(value: string | null): EmailLinkAction | null {
  if (value === "verify-email" || value === "reset-password" || value === "confirm-email-change") {
    return value;
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
  const localeFromCookie = request.cookies.get("NEXT_LOCALE")?.value;

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
