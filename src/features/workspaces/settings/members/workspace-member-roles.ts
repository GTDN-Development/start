const WORKSPACE_MEMBER_ROLE_VALUES = ["owner", "member"] as const;

type WorkspaceMemberRole = (typeof WORKSPACE_MEMBER_ROLE_VALUES)[number];

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

function isWorkspaceMemberRole(value: string): value is WorkspaceMemberRole {
  return WORKSPACE_MEMBER_ROLE_VALUES.includes(value as WorkspaceMemberRole);
}

function getWorkspaceMemberRoleLabel(role: WorkspaceMemberRole): string {
  if (role === "owner") {
    return "Owner";
  }

  return "Member";
}

export {
  WORKSPACE_MEMBER_ROLE_OPTIONS,
  WORKSPACE_MEMBER_ROLE_VALUES,
  getWorkspaceMemberRoleLabel,
  isWorkspaceMemberRole,
  type WorkspaceMemberRole,
};
