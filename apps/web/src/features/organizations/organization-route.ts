import type { Locale } from "next-intl";
import { notFound } from "next/navigation";
import { AUTH_REDIRECTS } from "@/config/auth";
import { redirect } from "@/i18n/navigation";
import type { UserOrganization } from "@/features/organizations/organization-types";
import type { ServerOrganizationResponse } from "@/server/organizations/organization-types";

export function requireOrganizationRouteAccess<TData extends { organization: UserOrganization }>(
  response: ServerOrganizationResponse<TData>,
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

    throw new Error(`Failed to resolve organization route: ${response.errorCode}`);
  }

  return response.data;
}
