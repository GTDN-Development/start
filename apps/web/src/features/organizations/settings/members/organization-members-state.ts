import type {
  OrganizationSettingsInvite,
  OrganizationSettingsMember,
} from "@/features/organizations/settings/organization-settings-types";
import type { OrganizationMemberRole } from "@/features/organizations/organization-role-rules";

const organizationMemberRoleOrder: Record<OrganizationMemberRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
};

export function addOrganizationSettingsInvite(
  invites: OrganizationSettingsInvite[],
  invite: OrganizationSettingsInvite
): OrganizationSettingsInvite[] {
  return [invite, ...invites.filter((currentInvite) => currentInvite.id !== invite.id)];
}

export function updateOrganizationSettingsInvite(
  invites: OrganizationSettingsInvite[],
  input: {
    inviteId: string;
    expiresAt: string;
    updatedAt: string;
  }
): OrganizationSettingsInvite[] {
  return invites.map((invite) =>
    invite.id === input.inviteId
      ? {
          ...invite,
          expiresAt: input.expiresAt,
          updatedAt: input.updatedAt,
        }
      : invite
  );
}

export function removeOrganizationSettingsInvite(
  invites: OrganizationSettingsInvite[],
  inviteId: string
): OrganizationSettingsInvite[] {
  return invites.filter((invite) => invite.id !== inviteId);
}

export function updateOrganizationSettingsMemberRole(
  members: OrganizationSettingsMember[],
  input: {
    memberId: string;
    role: OrganizationMemberRole;
  }
): OrganizationSettingsMember[] {
  return sortOrganizationSettingsMembers(
    members.map((member) =>
      member.id === input.memberId
        ? {
            ...member,
            role: input.role,
          }
        : member
    )
  );
}

export function removeOrganizationSettingsMember(
  members: OrganizationSettingsMember[],
  memberId: string
): OrganizationSettingsMember[] {
  return members.filter((member) => member.id !== memberId);
}

function sortOrganizationSettingsMembers(
  members: OrganizationSettingsMember[]
): OrganizationSettingsMember[] {
  return [...members].sort((firstMember, secondMember) => {
    const roleDifference =
      organizationMemberRoleOrder[firstMember.role] -
      organizationMemberRoleOrder[secondMember.role];

    if (roleDifference !== 0) {
      return roleDifference;
    }

    return getOrganizationMemberSortKey(firstMember).localeCompare(
      getOrganizationMemberSortKey(secondMember)
    );
  });
}

function getOrganizationMemberSortKey(member: OrganizationSettingsMember): string {
  return member.email || member.name || member.userId;
}
