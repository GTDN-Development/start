import { NextRequest, NextResponse } from "next/server";
import { POST_AUTH_PATH } from "@/config/routes";
import { getPathname, type AppHref } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { appendAuthCookiesToResponse } from "@/server/auth/auth-cookies";
import { confirmEmailVerificationToken } from "@/server/auth/auth-email-verification-service";
import {
  createVerifyEmailResultHref,
  parseVerifyEmailPageState,
} from "@/features/auth/verify-email/verify-email-state";

type VerifyEmailCompletionRouteContext = {
  params: Promise<{
    locale: string;
  }>;
};

export async function GET(request: NextRequest, context: VerifyEmailCompletionRouteContext) {
  const { locale } = await context.params;
  const appLocale = locale as AppLocale;
  const state = parseVerifyEmailPageState({
    token: request.nextUrl.searchParams.get("token") ?? undefined,
    email: request.nextUrl.searchParams.get("email") ?? undefined,
  });

  if (!state.token) {
    return redirectWithAuthCookies(
      request,
      undefined,
      createVerifyEmailResultHref({
        result: "invalid",
        email: state.email,
      }),
      appLocale
    );
  }

  const response = await confirmEmailVerificationToken(state.token);

  if (!response.ok) {
    return redirectWithAuthCookies(
      request,
      response.setCookie,
      createVerifyEmailResultHref({
        result: "invalid",
        email: state.email,
      }),
      appLocale
    );
  }

  if (response.data.session) {
    return redirectWithAuthCookies(request, response.setCookie, POST_AUTH_PATH, appLocale);
  }

  return redirectWithAuthCookies(
    request,
    response.setCookie,
    createVerifyEmailResultHref({
      result: "verified",
      email: state.email,
    }),
    appLocale
  );
}

function redirectWithAuthCookies(
  request: NextRequest,
  setCookie: string[] | undefined,
  href: AppHref,
  locale: AppLocale
): NextResponse {
  const pathname = getPathname({
    href,
    locale,
  });
  const response = NextResponse.redirect(new URL(pathname, request.nextUrl.origin), {
    status: 303,
  });

  return appendAuthCookiesToResponse(response, setCookie);
}
