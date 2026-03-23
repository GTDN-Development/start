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
    setMembers((currentMembers) =>
      sortWorkspaceSettingsMembers(
        currentMembers.map((member) => (member.id === memberId ? { ...member, role } : member))
      )
    );
  }

  function handleOwnershipTransferred(previousOwnerMemberId: string, nextOwnerMemberId: string) {
    setMembers((currentMembers) =>
      sortWorkspaceSettingsMembers(
        currentMembers.map((member) => {
          if (member.id === previousOwnerMemberId) {
            return {
              ...member,
              role: "admin",
            };
          }

          if (member.id === nextOwnerMemberId) {
            return {
              ...member,
              role: "owner",
            };
          }

          return member;
        })
      )
    );
  }

  function handleMemberRemoved(memberId: string) {
    setMembers((currentMembers) => currentMembers.filter((member) => member.id !== memberId));
  }

  return (
    <div className="grid gap-8">
      <WorkspaceInviteMembersSettingsItem
        workspace={workspace}
        onInviteCreated={handleInviteCreated}
      />
      <WorkspaceMembersManagementSettingsItem
        workspace={workspace}
        members={members}
        invites={invites}
        onInviteRemoved={handleInviteRemoved}
        onInviteResent={handleInviteResent}
        onMemberRemoved={handleMemberRemoved}
        onMemberRoleChanged={handleMemberRoleChanged}
        onOwnershipTransferred={handleOwnershipTransferred}
      />
    </div>
  );
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
