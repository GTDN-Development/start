import { NextRequest } from "next/server";
import { POST_AUTH_PATH } from "@/config/routes";
import type { AppLocale } from "@/i18n/routing";
import { redirectHrefWithAuthCookies } from "@/server/auth/auth-route-response";
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
    return redirectHrefWithAuthCookies(
      request,
      createVerifyEmailResultHref({
        result: "invalid",
        email: state.email,
      }),
      appLocale
    );
  }

  const response = await confirmEmailVerificationToken(state.token);

  if (!response.ok) {
    return redirectHrefWithAuthCookies(
      request,
      createVerifyEmailResultHref({
        result: "invalid",
        email: state.email,
      }),
      appLocale,
      response.cookieMutations
    );
  }

  if (response.data.session) {
    return redirectHrefWithAuthCookies(
      request,
      POST_AUTH_PATH,
      appLocale,
      response.cookieMutations
    );
  }

  return redirectHrefWithAuthCookies(
    request,
    createVerifyEmailResultHref({
      result: "verified",
      email: state.email,
    }),
    appLocale,
    response.cookieMutations
  );
}
