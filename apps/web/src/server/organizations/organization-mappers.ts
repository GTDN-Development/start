import type PocketBase from "pocketbase";
import type {
  UserOrganization,
  OrganizationInviteSummary,
  OrganizationInviteRole,
  OrganizationMemberSummary,
  OrganizationMemberRole,
  OrganizationSummary,
} from "@/server/organizations/organization-types";
import type {
  UsersRecord,
  OrganizationInvitesRecord,
  OrganizationMembersRecord,
  OrganizationsRecord,
} from "@/types/pocketbase";
import { getAvatarUrl, getNullableTrimmedString } from "@/server/pocketbase/pocketbase-utils";

export type OrganizationMemberRecordWithExpand = OrganizationMembersRecord & {
  expand?: {
    organization?: OrganizationsRecord;
    user?: UsersRecord;
  };
};

export type OrganizationInviteRecordWithExpand = OrganizationInvitesRecord & {
  expand?: {
    invited_by?: UsersRecord;
  };
};

export function mapOrganizationSummary(
  pb: PocketBase,
  organization: OrganizationsRecord
): OrganizationSummary {
  return {
    id: organization.id,
    name: organization.name,
    slug: organization.slug,
    avatarUrl: getOrganizationAvatarUrl(pb, organization),
  };
}

export function mapUserOrganizationSummary(
  pb: PocketBase,
  organization: OrganizationsRecord,
  membership: OrganizationMembersRecord
): UserOrganization {
  return {
    ...mapOrganizationSummary(pb, organization),
    membershipId: membership.id,
    role: membership.role,
  };
}

export function mapOrganizationMemberSummary(
  pb: PocketBase,
  memberRecord: OrganizationMemberRecordWithExpand
): OrganizationMemberSummary | null {
  const expandedUser = memberRecord.expand?.user;

  if (!expandedUser) {
    return null;
  }

  return {
    id: memberRecord.id,
    userId: expandedUser.id,
    email: expandedUser.email,
    name: getNullableTrimmedString(expandedUser.name),
    avatarUrl: getAvatarUrl(pb, expandedUser),
    role: memberRecord.role,
  };
}

export function mapOrganizationInviteSummary(
  inviteRecord: OrganizationInviteRecordWithExpand
): OrganizationInviteSummary {
  return {
    id: inviteRecord.id,
    emailNormalized: inviteRecord.email_normalized,
    role: inviteRecord.role,
    expiresAt: inviteRecord.expires_at,
    updatedAt: inviteRecord.updated,
    invitedByName: getNullableTrimmedString(inviteRecord.expand?.invited_by?.name),
  };
}

export function sortOrganizationMembers(
  firstMember: OrganizationMemberSummary,
  secondMember: OrganizationMemberSummary
): number {
  if (firstMember.role === secondMember.role) {
    return getOrganizationMemberSortKey(firstMember).localeCompare(
      getOrganizationMemberSortKey(secondMember)
    );
  }

  return getOrganizationRoleOrder(firstMember.role) - getOrganizationRoleOrder(secondMember.role);
}

export function sortUserOrganizations(
  firstOrganization: UserOrganization,
  secondOrganization: UserOrganization
): number {
  return firstOrganization.name.localeCompare(secondOrganization.name);
}

function getOrganizationAvatarUrl(
  pb: PocketBase,
  organization: OrganizationsRecord
): string | null {
  const avatarName = getNullableTrimmedString(organization.avatar);

  if (!avatarName) {
    return null;
  }

  return pb.files.getURL(organization, avatarName);
}

function getOrganizationRoleOrder(role: OrganizationMemberRole | OrganizationInviteRole): number {
  if (role === "owner") {
    return 0;
  }

  if (role === "admin") {
    return 1;
  }

  return 2;
}

function getOrganizationMemberSortKey(member: OrganizationMemberSummary): string {
  return member.email || member.name || member.userId;
}
