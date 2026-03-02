import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { evaluateAuthProxyGuard } from "@/features/auth/auth-proxy";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const authGuardResult = evaluateAuthProxyGuard(request);

  if (authGuardResult.shouldRedirect) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = authGuardResult.pathname;
    redirectUrl.search = "";

    return NextResponse.redirect(redirectUrl);
  }

  return intlMiddleware(request);
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};
