import type {
  OrganizationInviteSummary,
  OrganizationMemberRole,
  OrganizationMemberSummary,
} from "@/features/organizations/organization-types";

export type OrganizationSettingsOrganization = {
  id: string;
  slug: string;
  name: string;
  currentUserId: string;
  role: OrganizationMemberRole;
  isCurrentUserLastOwner: boolean;
  avatarUrl: string | null;
};

export type OrganizationSettingsMember = OrganizationMemberSummary;
export type OrganizationSettingsInvite = OrganizationInviteSummary;
