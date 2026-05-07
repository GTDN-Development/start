import { organizationConfig } from "@/config/organization";

export const ORGANIZATION_MEMBER_ROLE_VALUES = organizationConfig.roles.memberValues;
export const ORGANIZATION_INVITABLE_ROLE_VALUES = organizationConfig.roles.invitableValues;

export type OrganizationMemberRole = (typeof ORGANIZATION_MEMBER_ROLE_VALUES)[number];
export type OrganizationInvitableRole = (typeof ORGANIZATION_INVITABLE_ROLE_VALUES)[number];

export function isOrganizationMemberRole(value: string): value is OrganizationMemberRole {
  return ORGANIZATION_MEMBER_ROLE_VALUES.includes(value as OrganizationMemberRole);
}

export function isOrganizationInvitableRole(value: string): value is OrganizationInvitableRole {
  return ORGANIZATION_INVITABLE_ROLE_VALUES.includes(value as OrganizationInvitableRole);
}

export function canManageOrganizationMemberRole(
  actingRole: OrganizationMemberRole,
  targetRole: OrganizationMemberRole
): boolean {
  if (actingRole === "owner") {
    return true;
  }

  if (actingRole === "admin") {
    return targetRole !== "owner";
  }

  return false;
}

export function canAssignOrganizationMemberRole(
  actingRole: OrganizationMemberRole,
  nextRole: OrganizationMemberRole
): boolean {
  if (actingRole === "owner") {
    return true;
  }

  if (actingRole === "admin") {
    return nextRole !== "owner";
  }

  return false;
}

export function canChangeOrganizationMemberRole(
  actingRole: OrganizationMemberRole,
  targetRole: OrganizationMemberRole,
  nextRole: OrganizationMemberRole
): boolean {
  if (!canManageOrganizationMemberRole(actingRole, targetRole)) {
    return false;
  }

  if (!canAssignOrganizationMemberRole(actingRole, nextRole)) {
    return false;
  }

  if (nextRole === "owner") {
    return actingRole === "owner";
  }

  return true;
}

export function isLastOrganizationOwner(role: OrganizationMemberRole, ownerCount: number): boolean {
  return role === "owner" && ownerCount === 1;
}
