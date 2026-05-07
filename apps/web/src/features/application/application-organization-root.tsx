"use client";

import { OrganizationNavigationProvider } from "@/features/organizations/organization-navigation-context";
import type { OrganizationNavigationItem } from "@/features/organizations/organization-navigation-types";

type ApplicationOrganizationRootProps = {
  children: React.ReactNode;
  organizations: OrganizationNavigationItem[];
  activeOrganizationSlug: string | null;
};

export function ApplicationOrganizationRoot({
  children,
  organizations,
  activeOrganizationSlug,
}: ApplicationOrganizationRootProps) {
  const organizationNavigationKey = `${activeOrganizationSlug ?? ""}:${organizations
    .map((organization) =>
      [
        organization.id,
        organization.slug,
        organization.name,
        organization.role,
        organization.avatarUrl ?? "",
      ].join(":")
    )
    .join("|")}`;

  return (
    <OrganizationNavigationProvider
      key={organizationNavigationKey}
      initialOrganizations={organizations}
      initialActiveOrganizationSlug={activeOrganizationSlug}
    >
      {children}
    </OrganizationNavigationProvider>
  );
}
