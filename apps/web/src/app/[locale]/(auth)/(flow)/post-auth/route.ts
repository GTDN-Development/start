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
import { resolvePostAuthDestinationForUser } from "@/server/workspaces/workspace-shell-queries";

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
    const response = createRedirectResponse(
      request,
      getInviteHref(destinationResponse.data.inviteToken),
      appLocale
    );

    clearPendingInviteTokenResponseCookie(response);

    return appendAuthCookiesToResponse(response, authCookies);
  }

  if (destinationResponse.data.state === "workspace_redirect") {
    const response = createRedirectResponse(
      request,
      getWorkspaceOverviewHref(destinationResponse.data.workspaceSlug),
      appLocale
    );

    setActiveWorkspaceSlugResponseCookie(response, destinationResponse.data.workspaceSlug);

    return appendAuthCookiesToResponse(response, authCookies);
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

  return appendAuthCookiesToResponse(response, setCookie);
}

function createRedirectResponse(request: NextRequest, href: AppHref, locale: AppLocale) {
  const pathname = getPathname({
    href,
    locale,
  });

  return NextResponse.redirect(new URL(pathname, request.nextUrl.origin), {
    status: 303,
  });
}
