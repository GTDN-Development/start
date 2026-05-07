"use server";

import { z } from "zod";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  createOrganizationInviteInputSchema,
  organizationIdSchema,
  organizationSlugSchema,
} from "@/features/organizations/organization-schemas";
import {
  ORGANIZATION_MEMBER_ROLE_VALUES,
  type OrganizationMemberRole,
} from "@/features/organizations/organization-role-rules";
import {
  createBadRequestOrganizationResponse,
  finalizeOrganizationAction,
} from "@/server/organizations/organization-response";
import {
  createInvite,
  resendInvite,
  revokeInvite,
} from "@/server/organizations/organization-invite-mutations";
import {
  changeMemberRole,
  removeMember,
} from "@/server/organizations/organization-member-mutations";
import type {
  OrganizationInviteSummary,
  OrganizationResponse,
} from "@/features/organizations/organization-types";

const organizationMemberRoleSchema = z.enum(ORGANIZATION_MEMBER_ROLE_VALUES);
const createInviteInputSchema = createOrganizationInviteInputSchema(z.enum(routing.locales));

export async function changeMemberRoleAction(
  organizationSlug: string,
  memberId: string,
  role: OrganizationMemberRole
): Promise<OrganizationResponse<{ memberId: string; role: OrganizationMemberRole }>> {
  const parsedOrganizationSlug = organizationSlugSchema.safeParse(organizationSlug);
  const parsedMemberId = organizationIdSchema.safeParse(memberId);
  const parsedRole = organizationMemberRoleSchema.safeParse(role);

  if (!parsedOrganizationSlug.success || !parsedMemberId.success || !parsedRole.success) {
    return createBadRequestOrganizationResponse();
  }

  const response = await changeMemberRole(
    parsedOrganizationSlug.data,
    parsedMemberId.data,
    parsedRole.data
  );

  return finalizeOrganizationAction(response, {
    mapData: () => ({
      memberId: parsedMemberId.data,
      role: parsedRole.data,
    }),
  });
}

export async function removeMemberAction(
  organizationSlug: string,
  memberId: string
): Promise<OrganizationResponse<{ memberId: string }>> {
  const parsedOrganizationSlug = organizationSlugSchema.safeParse(organizationSlug);
  const parsedMemberId = organizationIdSchema.safeParse(memberId);

  if (!parsedOrganizationSlug.success || !parsedMemberId.success) {
    return createBadRequestOrganizationResponse();
  }

  const response = await removeMember(parsedOrganizationSlug.data, parsedMemberId.data);

  return finalizeOrganizationAction(response, {
    mapData: () => ({
      memberId: parsedMemberId.data,
    }),
  });
}

export async function createInviteAction(
  organizationSlug: string,
  input: {
    locale: AppLocale;
    email: string;
    role: "admin" | "member";
  }
): Promise<OrganizationResponse<{ invite: OrganizationInviteSummary }>> {
  const parsedOrganizationSlug = organizationSlugSchema.safeParse(organizationSlug);
  const parsedInput = createInviteInputSchema.safeParse(input);

  if (!parsedOrganizationSlug.success || !parsedInput.success) {
    return createBadRequestOrganizationResponse();
  }

  const response = await createInvite(parsedOrganizationSlug.data, parsedInput.data);

  return finalizeOrganizationAction(response);
}

export async function resendInviteAction(
  organizationSlug: string,
  inviteId: string,
  locale: AppLocale
): Promise<OrganizationResponse<{ inviteId: string; expiresAt: string; updatedAt: string }>> {
  const parsedOrganizationSlug = organizationSlugSchema.safeParse(organizationSlug);
  const parsedInviteId = organizationIdSchema.safeParse(inviteId);
  const parsedLocale = z.enum(routing.locales).safeParse(locale);

  if (!parsedOrganizationSlug.success || !parsedInviteId.success || !parsedLocale.success) {
    return createBadRequestOrganizationResponse();
  }

  const response = await resendInvite(
    parsedOrganizationSlug.data,
    parsedInviteId.data,
    parsedLocale.data
  );

  return finalizeOrganizationAction(response);
}

export async function revokeInviteAction(
  organizationSlug: string,
  inviteId: string
): Promise<OrganizationResponse<{ inviteId: string }>> {
  const parsedOrganizationSlug = organizationSlugSchema.safeParse(organizationSlug);
  const parsedInviteId = organizationIdSchema.safeParse(inviteId);

  if (!parsedOrganizationSlug.success || !parsedInviteId.success) {
    return createBadRequestOrganizationResponse();
  }

  const response = await revokeInvite(parsedOrganizationSlug.data, parsedInviteId.data);

  return finalizeOrganizationAction(response, {
    mapData: () => ({
      inviteId: parsedInviteId.data,
    }),
  });
}
