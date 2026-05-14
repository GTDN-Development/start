import { NextRequest } from "next/server";
import {
  APP_HOME_PATH,
  SIGN_IN_PATH,
  getInviteHref,
  getOrganizationOverviewHref,
} from "@/config/routes";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import {
  createRedirectResponse,
  redirectHrefWithAuthCookies,
} from "@/server/auth/auth-route-response";
import { appendAuthCookiesToResponse } from "@/server/auth/auth-cookies";
import { getResponseAuthSession } from "@/server/auth/auth-session-service";
import {
  clearPendingInviteTokenResponseCookie,
  setActiveOrganizationSlugResponseCookie,
} from "@/server/organizations/organization-cookie";
import { resolvePostAuthDestination } from "@/server/organizations/post-auth-destination";

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
    return redirectHrefWithAuthCookies(
      request,
      SIGN_IN_PATH,
      appLocale,
      sessionResponse.cookieMutations
    );
  }

  const destinationResponse = await resolvePostAuthDestination({
    userId: session.user.id,
  });
  const authCookies = [
    ...(sessionResponse.cookieMutations ?? []),
    ...(destinationResponse.cookieMutations ?? []),
  ];

  if (!destinationResponse.ok) {
    return redirectHrefWithAuthCookies(request, APP_HOME_PATH, appLocale, authCookies);
  }

  if (destinationResponse.data.state === "invite_redirect") {
    const response = createRedirectResponse(
      request,
      getPathname({
        href: getInviteHref(destinationResponse.data.inviteToken),
        locale: appLocale,
      })
    );

    clearPendingInviteTokenResponseCookie(response);

    return appendAuthCookiesToResponse(response, authCookies);
  }

  if (destinationResponse.data.state === "organization_redirect") {
    const response = createRedirectResponse(
      request,
      getPathname({
        href: getOrganizationOverviewHref(destinationResponse.data.organizationSlug),
        locale: appLocale,
      })
    );

    setActiveOrganizationSlugResponseCookie(response, destinationResponse.data.organizationSlug);

    return appendAuthCookiesToResponse(response, authCookies);
  }

  return redirectHrefWithAuthCookies(request, APP_HOME_PATH, appLocale, authCookies);
}
