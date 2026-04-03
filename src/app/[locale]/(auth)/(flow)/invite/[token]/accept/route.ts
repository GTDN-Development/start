import { NextRequest, NextResponse } from "next/server";
import { getInviteHref, getInviteStartHref, getWorkspaceOverviewHref } from "@/config/routes";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import { getServerAuthSession } from "@/server/auth/auth-session-service";
import { setActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";
import { acceptInviteTokenForUser } from "@/server/workspaces/workspace-invite-recipient-service";

type InviteAcceptRouteContext = {
  params: Promise<{
    locale: string;
    token: string;
  }>;
};

export async function POST(request: NextRequest, context: InviteAcceptRouteContext) {
  const { locale, token } = await context.params;
  const appLocale = locale as AppLocale;
  const sessionResponse = await getServerAuthSession();

  await applyServerAuthCookies(sessionResponse.setCookie);

  const session = sessionResponse.ok ? sessionResponse.data.session : null;

  if (!session) {
    return NextResponse.redirect(
      createLocalizedUrl(
        request,
        getPathname({
          href: getInviteStartHref(token),
          locale: appLocale,
        })
      ),
      { status: 303 }
    );
  }

  const acceptResponse = await acceptInviteTokenForUser(token, {
    id: session.user.id,
    email: session.user.email,
  });

  if (!acceptResponse.ok) {
    return NextResponse.redirect(
      createLocalizedUrl(
        request,
        getPathname({
          href: getInviteHref(token),
          locale: appLocale,
        })
      ),
      { status: 303 }
    );
  }

  if (
    acceptResponse.data.result.state === "accepted" ||
    acceptResponse.data.result.state === "already_member"
  ) {
    await setActiveWorkspaceSlugCookie(acceptResponse.data.result.workspace.slug);

    return NextResponse.redirect(
      createLocalizedUrl(
        request,
        getPathname({
          href: getWorkspaceOverviewHref(acceptResponse.data.result.workspace.slug),
          locale: appLocale,
        })
      ),
      { status: 303 }
    );
  }

  return NextResponse.redirect(
    createLocalizedUrl(
      request,
      getPathname({
        href: getInviteHref(token),
        locale: appLocale,
      })
    ),
    { status: 303 }
  );
}

function createLocalizedUrl(request: NextRequest, pathname: string): URL {
  return new URL(pathname, request.nextUrl.origin);
}
