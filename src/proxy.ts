import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { PB_AUTH_COOKIE_NAME, PB_AUTH_PERSIST_COOKIE_NAME } from "@/features/auth/auth-cookie";
import { evaluateAuthProxyGuard } from "@/features/auth/auth-proxy";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  const authGuardResult = evaluateAuthProxyGuard(request);

  if (authGuardResult.shouldRedirect) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = authGuardResult.pathname;
    redirectUrl.search = "";

    const response = NextResponse.redirect(redirectUrl);

    if (authGuardResult.shouldClearAuthCookies) {
      clearAuthCookies(response);
    }

    return response;
  }

  const response = intlMiddleware(request);

  if (response && authGuardResult.shouldClearAuthCookies) {
    clearAuthCookies(response);
  }

  return response;
}

export const config = {
  // Match all pathnames except for
  // - … if they start with `/api`, `/trpc`, `/_next` or `/_vercel`
  // - … the ones containing a dot (e.g. `favicon.ico`)
  matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
};

function clearAuthCookies(response: Response) {
  response.headers.append("set-cookie", createClearedCookieHeader(PB_AUTH_COOKIE_NAME));
  response.headers.append("set-cookie", createClearedCookieHeader(PB_AUTH_PERSIST_COOKIE_NAME));
}

function createClearedCookieHeader(cookieName: string) {
  const secureSuffix = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${cookieName}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT${secureSuffix}`;
}
