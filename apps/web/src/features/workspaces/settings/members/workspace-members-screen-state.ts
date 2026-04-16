import type {
  WorkspaceSettingsInvite,
  WorkspaceSettingsMember,
  WorkspaceSettingsWorkspace,
} from "@/features/workspaces/settings/workspace-settings-types";

export function applyWorkspaceMemberRoleChange(input: {
  workspace: WorkspaceSettingsWorkspace;
  members: WorkspaceSettingsMember[];
  memberId: string;
  role: WorkspaceSettingsMember["role"];
}): {
  workspace: WorkspaceSettingsWorkspace;
  members: WorkspaceSettingsMember[];
} {
  const nextMembers = sortWorkspaceSettingsMembers(
    input.members.map((member) =>
      member.id === input.memberId ? { ...member, role: input.role } : member
    )
  );

  return {
    workspace: deriveWorkspaceStateFromMembers(input.workspace, nextMembers),
    members: nextMembers,
  };
}

export function applyWorkspaceMemberRemoval(input: {
  workspace: WorkspaceSettingsWorkspace;
  members: WorkspaceSettingsMember[];
  memberId: string;
}): {
  workspace: WorkspaceSettingsWorkspace;
  members: WorkspaceSettingsMember[];
} {
  const nextMembers = input.members.filter((member) => member.id !== input.memberId);

  return {
    workspace: deriveWorkspaceStateFromMembers(input.workspace, nextMembers),
    members: nextMembers,
  };
}

export function applyWorkspaceInviteCreated(
  invites: WorkspaceSettingsInvite[],
  invite: WorkspaceSettingsInvite
) {
  return [invite, ...invites];
}

export function applyWorkspaceInvitePatched(
  invites: WorkspaceSettingsInvite[],
  inviteId: string,
  patch: Partial<WorkspaceSettingsInvite>
) {
  return invites.map((invite) => (invite.id === inviteId ? { ...invite, ...patch } : invite));
}

export function applyWorkspaceInviteRemoved(invites: WorkspaceSettingsInvite[], inviteId: string) {
  return invites.filter((invite) => invite.id !== inviteId);
}

function deriveWorkspaceStateFromMembers(
  workspace: WorkspaceSettingsWorkspace,
  members: WorkspaceSettingsMember[]
): WorkspaceSettingsWorkspace {
  const currentUserMember =
    members.find((member) => member.userId === workspace.currentUserId) ?? null;
  const ownerCount = members.filter((member) => member.role === "owner").length;

  if (!currentUserMember) {
    return workspace;
  }

  return {
    ...workspace,
    role: currentUserMember.role,
    isCurrentUserLastOwner: currentUserMember.role === "owner" && ownerCount === 1,
  };
}

function sortWorkspaceSettingsMembers(members: WorkspaceSettingsMember[]) {
  return [...members].sort((firstMember, secondMember) => {
    const roleOrderDifference =
      getWorkspaceRoleOrder(firstMember.role) - getWorkspaceRoleOrder(secondMember.role);

    if (roleOrderDifference !== 0) {
      return roleOrderDifference;
    }

    return getWorkspaceMemberSortKey(firstMember).localeCompare(
      getWorkspaceMemberSortKey(secondMember)
    );
  });
}

function getWorkspaceMemberSortKey(member: WorkspaceSettingsMember) {
  return member.email || member.name || member.userId;
}

function getWorkspaceRoleOrder(role: WorkspaceSettingsMember["role"]) {
  if (role === "owner") {
    return 0;
  }

  if (role === "admin") {
    return 1;
  }

  return 2;
}
