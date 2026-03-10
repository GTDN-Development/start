const WORKSPACE_MEMBER_ROLE_VALUES = ["owner", "member"] as const;
const WORKSPACE_INVITABLE_ROLE_VALUES = ["member"] as const;

type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLE_VALUES)[number];
type WorkspaceInvitableRole = (typeof WORKSPACE_INVITABLE_ROLE_VALUES)[number];

const WORKSPACE_MEMBER_ROLE_OPTIONS: Array<{
  value: WorkspaceMemberRole;
  label: string;
  description: string;
}> = [
  {
    value: "owner",
    label: "Owner",
    description: "Full access to workspace settings, members, and management.",
  },
  {
    value: "member",
    label: "Member",
    description: "Can collaborate in workspace, but cannot manage ownership.",
  },
];

const WORKSPACE_INVITABLE_ROLE_OPTIONS: Array<{
  value: WorkspaceInvitableRole;
  label: string;
  description: string;
}> = [
  {
    value: "member",
    label: "Member",
    description: "Can collaborate in workspace, but cannot manage ownership.",
  },
];

function isWorkspaceMemberRole(value: string): value is WorkspaceMemberRole {
  return WORKSPACE_MEMBER_ROLE_VALUES.includes(value as WorkspaceMemberRole);
}

function isWorkspaceInvitableRole(value: string): value is WorkspaceInvitableRole {
  return WORKSPACE_INVITABLE_ROLE_VALUES.includes(value as WorkspaceInvitableRole);
}

function getWorkspaceMemberRoleLabel(role: WorkspaceMemberRole): string {
  if (role === "owner") {
    return "Owner";
  }

  return "Member";
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
  type WorkspaceMemberRole,
};
