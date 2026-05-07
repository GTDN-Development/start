import { NextRequest, NextResponse } from "next/server";
import { getPathname, type AppHref } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { appendAuthCookiesToResponse, type AuthCookieMutations } from "@/server/auth/auth-cookies";

export function redirectHrefWithAuthCookies(
  request: NextRequest,
  href: AppHref,
  locale: AppLocale,
  cookieMutations?: AuthCookieMutations
): NextResponse {
  return redirectPathnameWithAuthCookies(
    request,
    getPathname({
      href,
      locale,
    }),
    cookieMutations
  );
}

export function redirectPathnameWithAuthCookies(
  request: NextRequest,
  pathname: string,
  cookieMutations?: AuthCookieMutations
): NextResponse {
  const response = createRedirectResponse(request, pathname);

  return appendAuthCookiesToResponse(response, cookieMutations);
}

export function createRedirectResponse(request: NextRequest, pathname: string): NextResponse {
  return NextResponse.redirect(new URL(pathname, request.nextUrl.origin), {
    status: 303,
  });
}
