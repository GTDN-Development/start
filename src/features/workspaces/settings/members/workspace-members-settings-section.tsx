"use client";

import { useState } from "react";
import { WorkspaceInviteMembersSettingsItem } from "@/features/workspaces/settings/members/workspace-invite-members-settings-item";
import { WorkspaceMembersManagementSettingsItem } from "@/features/workspaces/settings/members/workspace-members-management-settings-item";
import type {
  WorkspaceSettingsInvite,
  WorkspaceSettingsMember,
  WorkspaceSettingsWorkspace,
} from "@/features/workspaces/settings/workspace-settings-types";

export function WorkspaceMembersSettingsSection({
  workspace,
  initialMembers,
  initialInvites,
}: {
  workspace: WorkspaceSettingsWorkspace;
  initialMembers: WorkspaceSettingsMember[];
  initialInvites: WorkspaceSettingsInvite[];
}) {
  const [workspaceState, setWorkspaceState] = useState(workspace);
  const [members, setMembers] = useState(initialMembers);
  const [invites, setInvites] = useState(initialInvites);

  function handleInviteCreated(invite: WorkspaceSettingsInvite) {
    setInvites((currentInvites) => [invite, ...currentInvites]);
  }

  function handleInviteResent(
    inviteId: string,
    patch: Pick<WorkspaceSettingsInvite, "expiresAt" | "updatedAt" | "inviteUrl">
  ) {
    setInvites((currentInvites) =>
      currentInvites.map((invite) => (invite.id === inviteId ? { ...invite, ...patch } : invite))
    );
  }

  function handleInviteRemoved(inviteId: string) {
    setInvites((currentInvites) => currentInvites.filter((invite) => invite.id !== inviteId));
  }

  function handleMemberRoleChanged(memberId: string, role: WorkspaceSettingsMember["role"]) {
    setMembers((currentMembers) => {
      const nextMembers = sortWorkspaceSettingsMembers(
        currentMembers.map((member) => (member.id === memberId ? { ...member, role } : member))
      );

      setWorkspaceState((currentWorkspace) =>
        deriveWorkspaceStateFromMembers(currentWorkspace, nextMembers)
      );

      return nextMembers;
    });
  }

  function handleMemberRemoved(memberId: string) {
    setMembers((currentMembers) => {
      const nextMembers = currentMembers.filter((member) => member.id !== memberId);

      setWorkspaceState((currentWorkspace) =>
        deriveWorkspaceStateFromMembers(currentWorkspace, nextMembers)
      );

      return nextMembers;
    });
  }

  return (
    <div className="grid gap-8">
      <WorkspaceInviteMembersSettingsItem
        workspace={workspaceState}
        onInviteCreatedAction={handleInviteCreated}
      />
      <WorkspaceMembersManagementSettingsItem
        workspace={workspaceState}
        members={members}
        invites={invites}
        onInviteRemovedAction={handleInviteRemoved}
        onInviteResentAction={handleInviteResent}
        onMemberRemovedAction={handleMemberRemoved}
        onMemberRoleChangedAction={handleMemberRoleChanged}
      />
    </div>
  );
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

    return firstMember.email.localeCompare(secondMember.email);
  });
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
