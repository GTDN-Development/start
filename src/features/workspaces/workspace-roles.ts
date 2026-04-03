import { workspaceConfig } from "@/config/workspace";

export const WORKSPACE_MEMBER_ROLE_VALUES = workspaceConfig.roles.memberValues;
export const WORKSPACE_INVITABLE_ROLE_VALUES = workspaceConfig.roles.invitableValues;

export type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLE_VALUES)[number];
export type WorkspaceInvitableRole = (typeof WORKSPACE_INVITABLE_ROLE_VALUES)[number];
export type WorkspaceMemberRoleLabelKey = `${WorkspaceMemberRole}.label`;
export type WorkspaceMemberRoleDescriptionKey = `${WorkspaceMemberRole}.description`;
export type WorkspaceMemberRoleTranslationKey =
  | WorkspaceMemberRoleLabelKey
  | WorkspaceMemberRoleDescriptionKey;
export type WorkspaceMemberRoleTranslationFn = (key: WorkspaceMemberRoleTranslationKey) => string;

export const WORKSPACE_MEMBER_ROLE_OPTIONS: Array<{
  value: WorkspaceMemberRole;
  labelKey: WorkspaceMemberRoleLabelKey;
  descriptionKey: WorkspaceMemberRoleDescriptionKey;
}> = [
  {
    value: "owner",
    labelKey: "owner.label",
    descriptionKey: "owner.description",
  },
  {
    value: "admin",
    labelKey: "admin.label",
    descriptionKey: "admin.description",
  },
  {
    value: "member",
    labelKey: "member.label",
    descriptionKey: "member.description",
  },
];

export const WORKSPACE_INVITABLE_ROLE_OPTIONS: Array<{
  value: WorkspaceInvitableRole;
  labelKey: `${WorkspaceInvitableRole}.label`;
  descriptionKey: `${WorkspaceInvitableRole}.description`;
}> = [
  {
    value: "admin",
    labelKey: "admin.label",
    descriptionKey: "admin.description",
  },
  {
    value: "member",
    labelKey: "member.label",
    descriptionKey: "member.description",
  },
];

export function isWorkspaceMemberRole(value: string): value is WorkspaceMemberRole {
  return WORKSPACE_MEMBER_ROLE_VALUES.includes(value as WorkspaceMemberRole);
}

export function isWorkspaceInvitableRole(value: string): value is WorkspaceInvitableRole {
  return WORKSPACE_INVITABLE_ROLE_VALUES.includes(value as WorkspaceInvitableRole);
}

export function getWorkspaceMemberRoleLabel(
  role: WorkspaceMemberRole,
  t: WorkspaceMemberRoleTranslationFn
): string {
  if (role === "owner") {
    return t("owner.label");
  }

  if (role === "admin") {
    return t("admin.label");
  }

  return t("member.label");
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

export function getAssignableWorkspaceMemberRoleOptions(actingRole: WorkspaceMemberRole) {
  return WORKSPACE_MEMBER_ROLE_OPTIONS.filter((option) =>
    canAssignWorkspaceMemberRole(actingRole, option.value)
  );
}

export function isLastWorkspaceOwner(role: WorkspaceMemberRole, ownerCount: number): boolean {
  return role === "owner" && ownerCount === 1;
}
