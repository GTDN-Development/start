import {
  WORKSPACE_INVITABLE_ROLE_VALUES,
  WORKSPACE_MEMBER_ROLE_VALUES,
} from "@/config/workspace";

type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLE_VALUES)[number];
type WorkspaceInvitableRole = (typeof WORKSPACE_INVITABLE_ROLE_VALUES)[number];
type WorkspaceMemberRoleLabelKey = `${WorkspaceMemberRole}.label`;
type WorkspaceMemberRoleDescriptionKey = `${WorkspaceMemberRole}.description`;
type WorkspaceMemberRoleTranslationKey =
  | WorkspaceMemberRoleLabelKey
  | WorkspaceMemberRoleDescriptionKey;
type WorkspaceMemberRoleTranslationFn = (key: WorkspaceMemberRoleTranslationKey) => string;

const WORKSPACE_MEMBER_ROLE_OPTIONS: Array<{
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
    value: "member",
    labelKey: "member.label",
    descriptionKey: "member.description",
  },
];

const WORKSPACE_INVITABLE_ROLE_OPTIONS: Array<{
  value: WorkspaceInvitableRole;
  labelKey: `${WorkspaceInvitableRole}.label`;
  descriptionKey: `${WorkspaceInvitableRole}.description`;
}> = [
  {
    value: "member",
    labelKey: "member.label",
    descriptionKey: "member.description",
  },
];

function isWorkspaceMemberRole(value: string): value is WorkspaceMemberRole {
  return WORKSPACE_MEMBER_ROLE_VALUES.includes(value as WorkspaceMemberRole);
}

function isWorkspaceInvitableRole(value: string): value is WorkspaceInvitableRole {
  return WORKSPACE_INVITABLE_ROLE_VALUES.includes(value as WorkspaceInvitableRole);
}

function getWorkspaceMemberRoleLabel(
  role: WorkspaceMemberRole,
  t: WorkspaceMemberRoleTranslationFn
): string {
  if (role === "owner") {
    return t("owner.label");
  }

  return t("member.label");
}

export {
  WORKSPACE_INVITABLE_ROLE_OPTIONS,
  WORKSPACE_INVITABLE_ROLE_VALUES,
  WORKSPACE_MEMBER_ROLE_OPTIONS,
  WORKSPACE_MEMBER_ROLE_VALUES,
  getWorkspaceMemberRoleLabel,
  isWorkspaceInvitableRole,
  isWorkspaceMemberRole,
  type WorkspaceInvitableRole,
  type WorkspaceMemberRoleDescriptionKey,
  type WorkspaceMemberRoleLabelKey,
  type WorkspaceMemberRoleTranslationFn,
  type WorkspaceMemberRoleTranslationKey,
  type WorkspaceMemberRole,
};
