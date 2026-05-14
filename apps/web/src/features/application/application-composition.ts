import type PocketBase from "pocketbase";
import { organizationConfig } from "@/config/organization";
import type { UsersRecord } from "@/types/pocketbase";
import { APP_HOME_PATH, getOrganizationOverviewHref } from "@/config/routes";
import type { AppHref } from "@/i18n/navigation";
import type { OrganizationNavigationItem } from "@/features/organizations/organization-navigation-types";
import type { UserOrganization } from "@/features/organizations/organization-types";
import { getActiveOrganizationSlugCookie } from "@/server/organizations/organization-cookie";
import { listUserOrganizationShells } from "@/server/organizations/organization-shell-queries";
import type { ServerOrganizationResponse } from "@/server/organizations/organization-types";

export type ApplicationOrganizationNavigation = {
  organizations: OrganizationNavigationItem[];
  activeOrganizationSlug: string | null;
};

export type ApplicationShellModel = {
  applicationEntryHref: AppHref;
  organizationNavigation: ApplicationOrganizationNavigation | null;
};

export async function buildApplicationShellModel(input: {
  pb: PocketBase;
  user: UsersRecord;
}): Promise<ServerOrganizationResponse<ApplicationShellModel>> {
  if (!organizationConfig.enabled) {
    return {
      ok: true,
      data: {
        applicationEntryHref: APP_HOME_PATH,
        organizationNavigation: null,
      },
    };
  }

  const userOrganizationsResponse = await listUserOrganizationShells(input.pb, input.user.id);

  if (!userOrganizationsResponse.ok) {
    return userOrganizationsResponse;
  }

  const organizationNavigation = await resolveApplicationOrganizationNavigation(
    userOrganizationsResponse.data.organizations
  );

  return {
    ok: true,
    data: {
      applicationEntryHref: organizationNavigation?.activeOrganizationSlug
        ? getOrganizationOverviewHref(organizationNavigation.activeOrganizationSlug)
        : APP_HOME_PATH,
      organizationNavigation,
    },
  };
}

async function resolveApplicationOrganizationNavigation(
  organizations: UserOrganization[]
): Promise<ApplicationOrganizationNavigation | null> {
  const mappedOrganizations = organizations.map(mapOrganizationNavigationItem);

  if (mappedOrganizations.length === 0) {
    return null;
  }

  const requestedActiveOrganizationSlug = await getActiveOrganizationSlugCookie();
  const activeOrganizationSlug =
    requestedActiveOrganizationSlug &&
    mappedOrganizations.some(
      (organization) => organization.slug === requestedActiveOrganizationSlug
    )
      ? requestedActiveOrganizationSlug
      : null;

  return {
    organizations: mappedOrganizations,
    activeOrganizationSlug,
  };
}

function mapOrganizationNavigationItem(organization: UserOrganization): OrganizationNavigationItem {
  return {
    id: organization.id,
    slug: organization.slug,
    name: organization.name,
    role: organization.role,
    avatarUrl: organization.avatarUrl,
  };
}
