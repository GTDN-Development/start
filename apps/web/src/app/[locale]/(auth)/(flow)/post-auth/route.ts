import { NextRequest, NextResponse } from "next/server";
import {
  APP_HOME_PATH,
  SIGN_IN_PATH,
  getInviteHref,
  getWorkspaceOverviewHref,
} from "@/config/routes";
import { getPathname, type AppHref } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { getResponseAuthSession } from "@/server/auth/auth-session-service";
import { resolvePostAuthDestination } from "@/server/workspaces/workspace-resolution-service";
import {
  clearPendingInviteTokenResponseCookie,
  getPendingInviteTokenCookie,
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

  const pendingInviteToken = await getPendingInviteTokenCookie();
  const destinationResponse = await resolvePostAuthDestination({
    userId: session.user.id,
    userEmail: session.user.email,
    pendingInviteToken,
  });
  const authCookies = [
    ...(sessionResponse.setCookie ?? []),
    ...(destinationResponse.setCookie ?? []),
  ];

  if (!destinationResponse.ok) {
    return redirectWithAuthCookies(request, authCookies, APP_HOME_PATH, appLocale);
  }

  if (destinationResponse.data.state === "invite_redirect") {
    const response = createRedirectResponse(
      request,
      getInviteHref(destinationResponse.data.inviteToken),
      appLocale
    );

    clearPendingInviteTokenResponseCookie(response);
    appendAuthSetCookieHeaders(response, authCookies);

    return response;
  }

  if (destinationResponse.data.state === "workspace_redirect") {
    const response = createRedirectResponse(
      request,
      getWorkspaceOverviewHref(destinationResponse.data.workspaceSlug),
      appLocale
    );

    setActiveWorkspaceSlugResponseCookie(response, destinationResponse.data.workspaceSlug);
    appendAuthSetCookieHeaders(response, authCookies);

    return response;
  }

  return redirectWithAuthCookies(request, authCookies, APP_HOME_PATH, appLocale);
}

function redirectWithAuthCookies(
  request: NextRequest,
  setCookie: string[] | undefined,
  href: AppHref,
  locale: AppLocale
): NextResponse {
  const response = createRedirectResponse(request, href, locale);
  appendAuthSetCookieHeaders(response, setCookie);

  return response;
}

function createRedirectResponse(
  request: NextRequest,
  href: AppHref,
  locale: AppLocale
): NextResponse {
  const pathname = getPathname({
    href,
    locale,
  });
  return NextResponse.redirect(new URL(pathname, request.nextUrl.origin), {
    status: 303,
  });
}

function appendAuthSetCookieHeaders(response: NextResponse, setCookie: string[] | undefined): void {
  if (setCookie?.length) {
    for (const cookieValue of setCookie) {
      response.headers.append("set-cookie", cookieValue);
    }
  }
}
