import { workspaceConfig } from "@/config/workspace";

export const WORKSPACE_MEMBER_ROLE_VALUES = workspaceConfig.roles.memberValues;
export const WORKSPACE_INVITABLE_ROLE_VALUES = workspaceConfig.roles.invitableValues;

export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLE_VALUES)[number];
export type WorkspaceInvitableRole = (typeof WORKSPACE_INVITABLE_ROLE_VALUES)[number];

export function isWorkspaceMemberRole(value: string): value is WorkspaceMemberRole {
  return WORKSPACE_MEMBER_ROLE_VALUES.includes(value as WorkspaceMemberRole);
}

export function isWorkspaceInvitableRole(value: string): value is WorkspaceInvitableRole {
  return WORKSPACE_INVITABLE_ROLE_VALUES.includes(value as WorkspaceInvitableRole);
}

export function canManageWorkspaceMemberRole(
  actingRole: WorkspaceMemberRole,
  targetRole: WorkspaceMemberRole
): boolean {
  if (actingRole === "owner") {
    return true;
  }

  if (actingRole === "admin") {
    return targetRole !== "owner";
  }

  return false;
}

export function canAssignWorkspaceMemberRole(
  actingRole: WorkspaceMemberRole,
  nextRole: WorkspaceMemberRole
): boolean {
  if (actingRole === "owner") {
    return true;
  }

  if (actingRole === "admin") {
    return nextRole !== "owner";
  }

  return false;
}

export function canChangeWorkspaceMemberRole(
  actingRole: WorkspaceMemberRole,
  targetRole: WorkspaceMemberRole,
  nextRole: WorkspaceMemberRole
): boolean {
  if (!canManageWorkspaceMemberRole(actingRole, targetRole)) {
    return false;
  }

  if (!canAssignWorkspaceMemberRole(actingRole, nextRole)) {
    return false;
  }

  if (nextRole === "owner") {
    return actingRole === "owner";
  }

  return true;
}

export function isLastWorkspaceOwner(role: WorkspaceMemberRole, ownerCount: number): boolean {
  return role === "owner" && ownerCount === 1;
}
