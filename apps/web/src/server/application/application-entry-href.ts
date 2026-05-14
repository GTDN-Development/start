import type { AppHref } from "@/i18n/navigation";
import { APP_HOME_PATH, getOrganizationOverviewHref } from "@/config/routes";
import { resolveActiveOrganizationSlug } from "@/server/organizations/organization-navigation-queries";

export async function resolveApplicationEntryHref(userId: string): Promise<AppHref> {
  const organizationResponse = await resolveActiveOrganizationSlug(userId);

  if (!organizationResponse.ok || !organizationResponse.data.organizationSlug) {
    return APP_HOME_PATH;
  }

  return getOrganizationOverviewHref(organizationResponse.data.organizationSlug);
}
