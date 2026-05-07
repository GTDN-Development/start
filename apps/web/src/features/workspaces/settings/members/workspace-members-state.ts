import type {
  WorkspaceSettingsInvite,
  WorkspaceSettingsMember,
} from "@/features/workspaces/settings/workspace-settings-types";
import type { WorkspaceMemberRole } from "@/features/workspaces/workspace-role-rules";

const workspaceMemberRoleOrder: Record<WorkspaceMemberRole, number> = {
  owner: 0,
  admin: 1,
  member: 2,
};

export function addWorkspaceSettingsInvite(
  invites: WorkspaceSettingsInvite[],
  invite: WorkspaceSettingsInvite
): WorkspaceSettingsInvite[] {
  return [invite, ...invites.filter((currentInvite) => currentInvite.id !== invite.id)];
}

export function updateWorkspaceSettingsInvite(
  invites: WorkspaceSettingsInvite[],
  input: {
    inviteId: string;
    expiresAt: string;
    updatedAt: string;
  }
): WorkspaceSettingsInvite[] {
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

export function removeWorkspaceSettingsInvite(
  invites: WorkspaceSettingsInvite[],
  inviteId: string
): WorkspaceSettingsInvite[] {
  return invites.filter((invite) => invite.id !== inviteId);
}

export function updateWorkspaceSettingsMemberRole(
  members: WorkspaceSettingsMember[],
  input: {
    memberId: string;
    role: WorkspaceMemberRole;
  }
): WorkspaceSettingsMember[] {
  return sortWorkspaceSettingsMembers(
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

export function removeWorkspaceSettingsMember(
  members: WorkspaceSettingsMember[],
  memberId: string
): WorkspaceSettingsMember[] {
  return members.filter((member) => member.id !== memberId);
}

function sortWorkspaceSettingsMembers(
  members: WorkspaceSettingsMember[]
): WorkspaceSettingsMember[] {
  return [...members].sort((firstMember, secondMember) => {
    const roleDifference =
      workspaceMemberRoleOrder[firstMember.role] - workspaceMemberRoleOrder[secondMember.role];

    if (roleDifference !== 0) {
      return roleDifference;
    }

    return getWorkspaceMemberSortKey(firstMember).localeCompare(
      getWorkspaceMemberSortKey(secondMember)
    );
  });
}

function getWorkspaceMemberSortKey(member: WorkspaceSettingsMember): string {
  return member.email || member.name || member.userId;
}
