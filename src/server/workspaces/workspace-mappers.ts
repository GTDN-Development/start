import type PocketBase from "pocketbase";
import type {
  WorkspaceMemberRecordWithExpand,
  WorkspaceInviteRecordWithExpand,
} from "@/server/workspaces/workspace-repository";
import type {
  UserWorkspace,
  WorkspaceInviteSummary,
  WorkspaceMemberSummary,
  WorkspaceSummary,
} from "@/server/workspaces/workspace-types";
import type { WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";
import { getAvatarUrl, getNullableTrimmedString } from "@/server/pocketbase/pocketbase-utils";

export function mapWorkspaceSummary(pb: PocketBase, workspace: WorkspacesRecord): WorkspaceSummary {
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    kind: workspace.kind,
    avatarUrl: getWorkspaceAvatarUrl(pb, workspace),
  };
}

export function mapUserWorkspaceSummary(
  pb: PocketBase,
  workspace: WorkspacesRecord,
  membership: WorkspaceMembersRecord
): UserWorkspace {
  return {
    ...mapWorkspaceSummary(pb, workspace),
    membershipId: membership.id,
    role: membership.role,
  };
}

export function mapWorkspaceMemberSummary(
  pb: PocketBase,
  memberRecord: WorkspaceMemberRecordWithExpand
): WorkspaceMemberSummary | null {
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

export function mapWorkspaceInviteSummary(
  inviteRecord: WorkspaceInviteRecordWithExpand
): WorkspaceInviteSummary {
  return {
    id: inviteRecord.id,
    emailNormalized: inviteRecord.email_normalized,
    role: inviteRecord.role,
    expiresAt: inviteRecord.expires_at,
    updatedAt: inviteRecord.updated,
    invitedByName: getNullableTrimmedString(inviteRecord.expand?.invited_by?.name),
  };
}

export function sortWorkspaceMembers(
  firstMember: WorkspaceMemberSummary,
  secondMember: WorkspaceMemberSummary
): number {
  if (firstMember.role === secondMember.role) {
    return firstMember.email.localeCompare(secondMember.email);
  }

  return firstMember.role === "owner" ? -1 : 1;
}

export function sortUserWorkspaces(
  firstWorkspace: UserWorkspace,
  secondWorkspace: UserWorkspace
): number {
  if (firstWorkspace.kind === secondWorkspace.kind) {
    return firstWorkspace.name.localeCompare(secondWorkspace.name);
  }

  return firstWorkspace.kind === "personal" ? -1 : 1;
}

function getWorkspaceAvatarUrl(pb: PocketBase, workspace: WorkspacesRecord): string | null {
  const avatarName = getNullableTrimmedString(workspace.avatar);

  if (!avatarName) {
    return null;
  }

  return pb.files.getURL(workspace, avatarName);
}
