import { NextRequest, NextResponse } from "next/server";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import { getServerAuthSession } from "@/server/auth/auth-service";
import { setActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";
import { acceptInviteTokenForUser } from "@/server/workspaces/workspace-invite-service";
import type { WorkspaceInviteAcceptResult } from "@/server/workspaces/workspace-types";

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
          href: {
            pathname: "/invite/[token]/start",
            params: {
              token,
            },
          },
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
          href: {
            pathname: "/invite/[token]",
            params: {
              token,
            },
          },
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
          href: {
            pathname: "/w/[workspaceSlug]/overview",
            params: {
              workspaceSlug: acceptResponse.data.result.workspace.slug,
            },
          },
          locale: appLocale,
        })
      ),
      { status: 303 }
    );
  }

  return NextResponse.redirect(
    createInviteResultUrl(request, appLocale, acceptResponse.data.result),
    {
      status: 303,
    }
  );
}

function createInviteResultUrl(
  request: NextRequest,
  locale: AppLocale,
  result: Extract<
    WorkspaceInviteAcceptResult,
    { state: "email_mismatch" } | { state: "invalid_or_expired" }
  >
) {
  const inviteResultUrl = createLocalizedUrl(
    request,
    getPathname({
      href: "/invite/result",
      locale,
    })
  );

  inviteResultUrl.searchParams.set("state", result.state);

  if (result.state === "email_mismatch") {
    inviteResultUrl.searchParams.set("invitedEmail", result.invitedEmail);
    inviteResultUrl.searchParams.set("currentEmail", result.currentEmail);
  }

  return inviteResultUrl;
}

function createLocalizedUrl(request: NextRequest, pathname: string): URL {
  return new URL(pathname, request.nextUrl.origin);
}
