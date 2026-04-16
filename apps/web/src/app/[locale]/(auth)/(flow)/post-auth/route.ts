import { NextRequest, NextResponse } from "next/server";
import {
  APP_HOME_PATH,
  SIGN_IN_PATH,
  getInviteHref,
  getWorkspaceOverviewHref,
} from "@/config/routes";
import { getPathname, type AppHref } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { appendAuthCookiesToResponse } from "@/server/auth/auth-cookies";
import { getResponseAuthSession } from "@/server/auth/auth-session-service";
import {
  clearPendingInviteTokenResponseCookie,
  setActiveWorkspaceSlugResponseCookie,
} from "@/server/workspaces/workspace-cookie";
import { resolvePostAuthDestinationForUser } from "@/server/workspaces/workspace-resolution-service";

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

  const destinationResponse = await resolvePostAuthDestinationForUser({
    userId: session.user.id,
  });
  const authCookies = [
    ...(sessionResponse.setCookie ?? []),
    ...(destinationResponse.setCookie ?? []),
  ];

  if (!destinationResponse.ok) {
    return redirectWithAuthCookies(request, authCookies, APP_HOME_PATH, appLocale);
  }

  if (destinationResponse.data.state === "invite_redirect") {
    const response = redirectWithAuthCookies(
      request,
      authCookies,
      getInviteHref(destinationResponse.data.inviteToken),
      appLocale
    );

    clearPendingInviteTokenResponseCookie(response);

    return response;
  }

  if (destinationResponse.data.state === "workspace_redirect") {
    const response = redirectWithAuthCookies(
      request,
      authCookies,
      getWorkspaceOverviewHref(destinationResponse.data.workspaceSlug),
      appLocale
    );

    setActiveWorkspaceSlugResponseCookie(response, destinationResponse.data.workspaceSlug);

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
  const pathname = getPathname({
    href,
    locale,
  });
  const response = NextResponse.redirect(new URL(pathname, request.nextUrl.origin), {
    status: 303,
  });

  return appendAuthCookiesToResponse(response, setCookie);
}
