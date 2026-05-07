import {
  getOrganizationSlugFromPathname,
  normalizeOrganizationSlug,
} from "@/features/application/application-scope";
import type { OrganizationNavigationItem } from "@/features/organizations/organization-navigation-types";

export function resolveSelectedOrganizationSlug(
  pathname: string,
  activeOrganizationSlug: string | null,
  organizations: OrganizationNavigationItem[]
): string | null {
  const pathnameOrganizationSlug = getOrganizationSlugFromPathname(pathname);

  if (
    pathnameOrganizationSlug &&
    isOrganizationSlugAvailable(organizations, pathnameOrganizationSlug)
  ) {
    return pathnameOrganizationSlug;
  }

  const normalizedActiveOrganizationSlug = normalizeOrganizationSlug(activeOrganizationSlug);

  if (
    normalizedActiveOrganizationSlug &&
    isOrganizationSlugAvailable(organizations, normalizedActiveOrganizationSlug)
  ) {
    return normalizedActiveOrganizationSlug;
  }

  return null;
}

function isOrganizationSlugAvailable(
  organizations: OrganizationNavigationItem[],
  organizationSlug: string
): boolean {
  return organizations.some((organization) => organization.slug === organizationSlug);
}
