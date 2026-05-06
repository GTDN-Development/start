import { NextRequest } from "next/server";
import { getInviteHref, getInviteStartHref, getWorkspaceOverviewHref } from "@/config/routes";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { appendAuthCookiesToResponse } from "@/server/auth/auth-cookies";
import {
  createRedirectResponse,
  redirectPathnameWithAuthCookies,
} from "@/server/auth/auth-route-response";
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
    return redirectPathnameWithAuthCookies(
      request,
      getPathname({
        href: getInviteStartHref(token),
        locale: appLocale,
      }),
      sessionResponse.cookieMutations
    );
  }

  const inspectResponse = await getInviteTokenForUser(token);

  if (!inspectResponse.ok || inspectResponse.data.result.state !== "already_member") {
    return redirectPathnameWithAuthCookies(
      request,
      getPathname({
        href: getInviteHref(token),
        locale: appLocale,
      }),
      sessionResponse.cookieMutations
    );
  }

  const response = createRedirectResponse(
    request,
    getPathname({
      href: getWorkspaceOverviewHref(inspectResponse.data.result.workspace.slug),
      locale: appLocale,
    })
  );

  setActiveWorkspaceSlugResponseCookie(response, inspectResponse.data.result.workspace.slug);

  return appendAuthCookiesToResponse(response, sessionResponse.cookieMutations);
}

export async function POST(request: NextRequest, context: InviteAcceptRouteContext) {
  const { locale, token } = await context.params;
  const appLocale = locale as AppLocale;
  const sessionResponse = await getResponseAuthSession();

  const session = sessionResponse.ok ? sessionResponse.data.session : null;

  if (!session) {
    return redirectPathnameWithAuthCookies(
      request,
      getPathname({
        href: getInviteStartHref(token),
        locale: appLocale,
      }),
      sessionResponse.cookieMutations
    );
  }

  const acceptResponse = await acceptInviteTokenForUser(token);

  if (!acceptResponse.ok) {
    return redirectPathnameWithAuthCookies(
      request,
      getPathname({
        href: getInviteHref(token),
        locale: appLocale,
      }),
      sessionResponse.cookieMutations
    );
  }

  if (
    acceptResponse.data.result.state === "accepted" ||
    acceptResponse.data.result.state === "already_member"
  ) {
    const response = createRedirectResponse(
      request,
      getPathname({
        href: getWorkspaceOverviewHref(acceptResponse.data.result.workspace.slug),
        locale: appLocale,
      })
    );

    setActiveWorkspaceSlugResponseCookie(response, acceptResponse.data.result.workspace.slug);

    return appendAuthCookiesToResponse(response, sessionResponse.cookieMutations);
  }

  return redirectPathnameWithAuthCookies(
    request,
    getPathname({
      href: getInviteHref(token),
      locale: appLocale,
    }),
    sessionResponse.cookieMutations
  );
}
