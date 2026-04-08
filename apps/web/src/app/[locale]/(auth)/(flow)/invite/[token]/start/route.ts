import { NextRequest, NextResponse } from "next/server";
import { SIGN_IN_PATH, getInviteHref } from "@/config/routes";
import { getPathname } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { setPendingInviteTokenResponseCookie } from "@/server/workspaces/workspace-cookie";
import { validateInviteToken } from "@/server/workspaces/workspace-invite-recipient-service";

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
      new URL(
        getPathname({
          href: getInviteHref(token),
          locale: appLocale,
        }),
        request.nextUrl.origin
      )
    );
  }

  const response = NextResponse.redirect(
    new URL(
      getPathname({
        href: SIGN_IN_PATH,
        locale: appLocale,
      }),
      request.nextUrl.origin
    )
  );

  setPendingInviteTokenResponseCookie(response, token);

  return response;
}
