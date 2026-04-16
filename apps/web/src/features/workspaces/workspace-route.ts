import type { Locale } from "next-intl";
import { notFound } from "next/navigation";
import { AUTH_REDIRECTS } from "@/config/auth";
import { redirect } from "@/i18n/navigation";
import type { ServerWorkspaceResponse, UserWorkspace } from "@/server/workspaces/workspace-types";

export function requireWorkspaceRouteAccess<TData extends { workspace: UserWorkspace }>(
  response: ServerWorkspaceResponse<TData>,
  locale: Locale
): TData {
  if (!response.ok) {
    if (response.errorCode === "UNAUTHORIZED") {
      redirect({
        href: AUTH_REDIRECTS.unauthenticatedTo,
        locale,
      });
    }

    if (response.errorCode === "FORBIDDEN" || response.errorCode === "NOT_FOUND") {
      notFound();
    }

    throw new Error(`Failed to resolve workspace route: ${response.errorCode}`);
  }

  return response.data;
}
