import { hasLocale } from "next-intl";
import type { Locale } from "next-intl";
import { NextRequest, NextResponse } from "next/server";
import { getPathname, type AppPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const NEXT_INTL_LOCALE_COOKIE_NAME = "NEXT_LOCALE";

const pocketBaseEmailActionPathnames = {
  "confirm-email-change": "/confirm-email-change",
  "reset-password": "/reset-password",
  "verify-email": "/verify-email",
} as const satisfies Record<string, AppPathname>;

type PocketBaseEmailAction = keyof typeof pocketBaseEmailActionPathnames;

export function GET(request: NextRequest) {
  const locale = resolveLocale(request);
  const action = parseAction(request.nextUrl.searchParams.get("action"));

  if (!action) {
    const fallbackUrl = new URL(getPathname({ href: "/", locale }), request.url);

    return NextResponse.redirect(fallbackUrl, { status: 302 });
  }

  const destination = new URL(
    getPathname({
      href: pocketBaseEmailActionPathnames[action],
      locale,
    }),
    request.url
  );

  for (const [key, value] of request.nextUrl.searchParams.entries()) {
    if (key === "action" || key === "locale") {
      continue;
    }

    destination.searchParams.append(key, value);
  }

  return NextResponse.redirect(destination, { status: 307 });
}

function parseAction(value: string | null): PocketBaseEmailAction | null {
  if (!value) {
    return null;
  }

  if (value === "verify-email" || value === "reset-password" || value === "confirm-email-change") {
    return value;
  }

  return null;
}

function resolveLocale(request: NextRequest): Locale {
  const explicitLocale = normalizeLocale(request.nextUrl.searchParams.get("locale"));

  if (explicitLocale) {
    return explicitLocale;
  }

  const cookieLocale = normalizeLocale(request.cookies.get(NEXT_INTL_LOCALE_COOKIE_NAME)?.value ?? null);

  if (cookieLocale) {
    return cookieLocale;
  }

  const headerLocale = getLocaleFromAcceptLanguage(request.headers.get("accept-language"));

  if (headerLocale) {
    return headerLocale;
  }

  return routing.defaultLocale;
}

function normalizeLocale(value: string | null): Locale | null {
  if (!value) {
    return null;
  }

  return hasLocale(routing.locales, value) ? value : null;
}

function getLocaleFromAcceptLanguage(headerValue: string | null): Locale | null {
  if (!headerValue) {
    return null;
  }

  const parts = headerValue.split(",");

  for (const part of parts) {
    const languageTag = part.split(";")[0]?.trim().toLowerCase();

    if (!languageTag) {
      continue;
    }

    const baseLocale = languageTag.split("-")[0] ?? "";

    if (hasLocale(routing.locales, baseLocale)) {
      return baseLocale;
    }
  }

  return null;
}
