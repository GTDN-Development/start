import {
  canAssignWorkspaceMemberRole,
  type WorkspaceInvitableRole,
  type WorkspaceMemberRole,
} from "@/features/workspaces/workspace-role-rules";

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

export function getAssignableWorkspaceMemberRoleOptions(actingRole: WorkspaceMemberRole) {
  return WORKSPACE_MEMBER_ROLE_OPTIONS.filter((option) =>
    canAssignWorkspaceMemberRole(actingRole, option.value)
  );
}
