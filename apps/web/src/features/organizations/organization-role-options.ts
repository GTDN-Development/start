import {
  canAssignOrganizationMemberRole,
  type OrganizationInvitableRole,
  type OrganizationMemberRole,
} from "@/features/organizations/organization-role-rules";

export type OrganizationMemberRoleLabelKey = `${OrganizationMemberRole}.label`;
export type OrganizationMemberRoleDescriptionKey = `${OrganizationMemberRole}.description`;
export type OrganizationMemberRoleTranslationKey =
  | OrganizationMemberRoleLabelKey
  | OrganizationMemberRoleDescriptionKey;
export type OrganizationMemberRoleTranslationFn = (
  key: OrganizationMemberRoleTranslationKey
) => string;

export const ORGANIZATION_MEMBER_ROLE_OPTIONS: Array<{
  value: OrganizationMemberRole;
  labelKey: OrganizationMemberRoleLabelKey;
  descriptionKey: OrganizationMemberRoleDescriptionKey;
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

export const ORGANIZATION_INVITABLE_ROLE_OPTIONS: Array<{
  value: OrganizationInvitableRole;
  labelKey: `${OrganizationInvitableRole}.label`;
  descriptionKey: `${OrganizationInvitableRole}.description`;
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

export function getOrganizationMemberRoleLabel(
  role: OrganizationMemberRole,
  t: OrganizationMemberRoleTranslationFn
): string {
  if (role === "owner") {
    return t("owner.label");
  }

  if (role === "admin") {
    return t("admin.label");
  }

  return t("member.label");
}

export function getAssignableOrganizationMemberRoleOptions(actingRole: OrganizationMemberRole) {
  return ORGANIZATION_MEMBER_ROLE_OPTIONS.filter((option) =>
    canAssignOrganizationMemberRole(actingRole, option.value)
  );
}
