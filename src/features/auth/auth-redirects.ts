import type { AppPathname } from "@/i18n/navigation";

export const authRedirectPaths = {
  dashboard: "/dashboard",
  login: "/login",
} as const satisfies Record<string, AppPathname>;

export type AuthRedirectPath = (typeof authRedirectPaths)[keyof typeof authRedirectPaths];

export function parseAuthRedirectPath(value: unknown): AuthRedirectPath | undefined {
  if (value === authRedirectPaths.dashboard || value === authRedirectPaths.login) {
    return value;
  }

  return undefined;
}
