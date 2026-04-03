import type { SerializeOptions } from "pocketbase";

export function getBaseServerCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  } satisfies SerializeOptions;
}

const READONLY_REQUEST_COOKIES_ERROR_MESSAGE =
  "Cookies can only be modified in a Server Action or Route Handler.";

export function isReadonlyRequestCookiesError(error: unknown): boolean {
  return error instanceof Error && error.message.includes(READONLY_REQUEST_COOKIES_ERROR_MESSAGE);
}
