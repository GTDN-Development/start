import { NextRequest, NextResponse } from "next/server";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { setPendingInviteHashCookie } from "@/server/workspaces/workspace-cookie";
import {
  hashInviteToken,
  validateInviteToken,
} from "@/server/workspaces/workspace-invite-service";

type InviteStartRouteContext = {
  params: Promise<{
    locale: string;
    token: string;
  }>;
};

export async function GET(request: NextRequest, context: InviteStartRouteContext) {
  const { locale, token } = await context.params;
  const appLocale = locale as AppLocale;
  const validationResponse = await validateInviteToken(token);

  if (!validationResponse.ok || !validationResponse.data.isValid) {
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
      )
    );
  }

  await setPendingInviteHashCookie(hashInviteToken(token));

  return NextResponse.redirect(
    createLocalizedUrl(
      request,
      getPathname({
        href: "/sign-in",
        locale: appLocale,
      })
    )
  );
}

export function createLocalizedUrl(request: NextRequest, pathname: string): URL {
  return new URL(pathname, request.nextUrl.origin);
}
