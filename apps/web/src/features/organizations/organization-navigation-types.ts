import type { OrganizationMemberRole } from "@/features/organizations/organization-role-rules";
import type { AppHref } from "@/i18n/navigation";

export type OrganizationNavigationItem = {
  id: string;
  slug: string;
  name: string;
  role: OrganizationMemberRole;
  avatarUrl: string | null;
};

export type OrganizationNavigationPatch = {
  upsertOrganization?: OrganizationNavigationItem;
  removeOrganizationId?: string;
  activeOrganizationSlug?: string | null;
  redirectHref?: AppHref;
};
