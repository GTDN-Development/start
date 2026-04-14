import { NextRequest, NextResponse } from "next/server";
import { APP_HOME_PATH, SIGN_IN_PATH } from "@/config/routes";
import { resolveApplicationPostAuthState } from "@/features/application/application-composition";
import { getPathname, type AppHref } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { appendAuthCookiesToResponse } from "@/server/auth/auth-cookies";
import { getResponseAuthSession } from "@/server/auth/auth-session-service";
import {
  clearPendingInviteTokenResponseCookie,
  setActiveWorkspaceSlugResponseCookie,
} from "@/server/workspaces/workspace-cookie";

type PostAuthRouteContext = {
  params: Promise<{
    locale: string;
  }>;
};

export async function GET(request: NextRequest, context: PostAuthRouteContext) {
  const { locale } = await context.params;
  const appLocale = locale as AppLocale;
  const sessionResponse = await getResponseAuthSession();
  const session = sessionResponse.ok ? sessionResponse.data.session : null;

  if (!session) {
    return redirectWithAuthCookies(request, sessionResponse.setCookie, SIGN_IN_PATH, appLocale);
  }

  const destinationResponse = await resolveApplicationPostAuthState({
    userId: session.user.id,
    userEmail: session.user.email,
  });
  const authCookies = [
    ...(sessionResponse.setCookie ?? []),
    ...(destinationResponse.setCookie ?? []),
  ];

  if (!destinationResponse.ok) {
    return redirectWithAuthCookies(request, authCookies, APP_HOME_PATH, appLocale);
  }

  const response = redirectWithAuthCookies(
    request,
    authCookies,
    destinationResponse.data.href,
    appLocale
  );

  if (destinationResponse.data.clearPendingInviteToken) {
    clearPendingInviteTokenResponseCookie(response);
  }

  if (destinationResponse.data.activeWorkspaceSlug) {
    setActiveWorkspaceSlugResponseCookie(response, destinationResponse.data.activeWorkspaceSlug);
  }

  return response;
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
