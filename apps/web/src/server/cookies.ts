import type { SerializeOptions } from "pocketbase";

export function getBaseServerCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  } satisfies SerializeOptions;
}
