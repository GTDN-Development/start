import { NextRequest, NextResponse } from "next/server";
import { getInviteHref, getInviteStartHref, getWorkspaceOverviewHref } from "@/config/routes";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { appendAuthCookiesToResponse } from "@/server/auth/auth-cookies";
import { getResponseAuthSession } from "@/server/auth/auth-session-service";
import { setActiveWorkspaceSlugResponseCookie } from "@/server/workspaces/workspace-cookie";
import {
  acceptInviteTokenForUser,
  getInviteTokenForUser,
} from "@/server/workspaces/workspace-invite-recipient-service";

type InviteAcceptRouteContext = {
  params: Promise<{
    locale: string;
    token: string;
  }>;
};

export async function GET(request: NextRequest, context: InviteAcceptRouteContext) {
  const { locale, token } = await context.params;
  const appLocale = locale as AppLocale;
  const sessionResponse = await getResponseAuthSession();
  const session = sessionResponse.ok ? sessionResponse.data.session : null;

  if (!session) {
    return redirectWithAuthCookies(
      request,
      sessionResponse.setCookie,
      getPathname({
        href: getInviteStartHref(token),
        locale: appLocale,
      })
    );
  }

  const inspectResponse = await getInviteTokenForUser(token, {
    id: session.user.id,
    email: session.user.email,
  });

  if (!inspectResponse.ok || inspectResponse.data.result.state !== "already_member") {
    return redirectWithAuthCookies(
      request,
      sessionResponse.setCookie,
      getPathname({
        href: getInviteHref(token),
        locale: appLocale,
      })
    );
  }

  const response = redirectWithAuthCookies(
    request,
    sessionResponse.setCookie,
    getPathname({
      href: getWorkspaceOverviewHref(inspectResponse.data.result.workspace.slug),
      locale: appLocale,
    })
  );

  setActiveWorkspaceSlugResponseCookie(response, inspectResponse.data.result.workspace.slug);

  return response;
}

export async function POST(request: NextRequest, context: InviteAcceptRouteContext) {
  const { locale, token } = await context.params;
  const appLocale = locale as AppLocale;
  const sessionResponse = await getResponseAuthSession();

  const session = sessionResponse.ok ? sessionResponse.data.session : null;

  if (!session) {
    return redirectWithAuthCookies(
      request,
      sessionResponse.setCookie,
      getPathname({
        href: getInviteStartHref(token),
        locale: appLocale,
      })
    );
  }

  const acceptResponse = await acceptInviteTokenForUser(token, {
    id: session.user.id,
    email: session.user.email,
  });

  if (!acceptResponse.ok) {
    return redirectWithAuthCookies(
      request,
      sessionResponse.setCookie,
      getPathname({
        href: getInviteHref(token),
        locale: appLocale,
      })
    );
  }

  if (
    acceptResponse.data.result.state === "accepted" ||
    acceptResponse.data.result.state === "already_member"
  ) {
    const response = redirectWithAuthCookies(
      request,
      sessionResponse.setCookie,
      getPathname({
        href: getWorkspaceOverviewHref(acceptResponse.data.result.workspace.slug),
        locale: appLocale,
      })
    );

    setActiveWorkspaceSlugResponseCookie(response, acceptResponse.data.result.workspace.slug);

    return response;
  }

  return redirectWithAuthCookies(
    request,
    sessionResponse.setCookie,
    getPathname({
      href: getInviteHref(token),
      locale: appLocale,
    })
  );
}

function redirectWithAuthCookies(
  request: NextRequest,
  setCookie: string[] | undefined,
  pathname: string
): NextResponse {
  const response = NextResponse.redirect(new URL(pathname, request.nextUrl.origin), {
    status: 303,
  });

  return appendAuthCookiesToResponse(response, setCookie);
}
