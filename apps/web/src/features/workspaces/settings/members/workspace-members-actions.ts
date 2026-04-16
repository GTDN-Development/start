"use server";

import { z } from "zod";
import { routing, type AppLocale } from "@/i18n/routing";
import {
  createWorkspaceInviteInputSchema,
  workspaceIdSchema,
  workspaceSlugSchema,
} from "@/features/workspaces/workspace-schemas";
import {
  WORKSPACE_MEMBER_ROLE_VALUES,
  type WorkspaceMemberRole,
} from "@/features/workspaces/workspace-role-rules";
import {
  changeWorkspaceMemberRoleForCurrentUser,
  removeWorkspaceMemberForCurrentUser,
} from "@/server/workspaces/workspace-members-service";
import {
  createWorkspaceInviteForCurrentUser,
  refreshWorkspaceInviteLinkForCurrentUser,
  resendWorkspaceInviteForCurrentUser,
  revokeWorkspaceInviteForCurrentUser,
} from "@/server/workspaces/workspace-invite-service";
import {
  createBadRequestWorkspaceResponse,
  finalizeWorkspaceAction,
} from "@/server/workspaces/workspace-response";
import type {
  WorkspaceInviteSummary,
  WorkspaceResponse,
} from "@/server/workspaces/workspace-types";

const workspaceMemberRoleSchema = z.enum(WORKSPACE_MEMBER_ROLE_VALUES);
const createInviteInputSchema = createWorkspaceInviteInputSchema(z.enum(routing.locales));

export async function changeMemberRoleAction(
  workspaceSlug: string,
  memberId: string,
  role: WorkspaceMemberRole
): Promise<WorkspaceResponse<{ memberId: string; role: WorkspaceMemberRole }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedMemberId = workspaceIdSchema.safeParse(memberId);
  const parsedRole = workspaceMemberRoleSchema.safeParse(role);

  if (!parsedWorkspaceSlug.success || !parsedMemberId.success || !parsedRole.success) {
    return createBadRequestWorkspaceResponse();
  }

  const response = await changeWorkspaceMemberRoleForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedMemberId.data,
    parsedRole.data
  );

  return finalizeWorkspaceAction(response, {
    mapData: () => ({
      memberId: parsedMemberId.data,
      role: parsedRole.data,
    }),
  });
}

export async function removeMemberAction(
  workspaceSlug: string,
  memberId: string
): Promise<WorkspaceResponse<{ memberId: string }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedMemberId = workspaceIdSchema.safeParse(memberId);

  if (!parsedWorkspaceSlug.success || !parsedMemberId.success) {
    return createBadRequestWorkspaceResponse();
  }

  const response = await removeWorkspaceMemberForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedMemberId.data
  );

  return finalizeWorkspaceAction(response, {
    mapData: () => ({
      memberId: parsedMemberId.data,
    }),
  });
}

export async function createInviteAction(
  workspaceSlug: string,
  input: {
    locale: AppLocale;
    email: string;
    role: "admin" | "member";
  }
): Promise<WorkspaceResponse<{ invite: WorkspaceInviteSummary }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedInput = createInviteInputSchema.safeParse(input);

  if (!parsedWorkspaceSlug.success || !parsedInput.success) {
    return createBadRequestWorkspaceResponse();
  }

  const response = await createWorkspaceInviteForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedInput.data
  );

  return finalizeWorkspaceAction(response);
}

export async function resendInviteAction(
  workspaceSlug: string,
  inviteId: string,
  locale: AppLocale
): Promise<
  WorkspaceResponse<{ inviteId: string; expiresAt: string; updatedAt: string; inviteUrl: string }>
> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedInviteId = workspaceIdSchema.safeParse(inviteId);
  const parsedLocale = z.enum(routing.locales).safeParse(locale);

  if (!parsedWorkspaceSlug.success || !parsedInviteId.success || !parsedLocale.success) {
    return createBadRequestWorkspaceResponse();
  }

  const response = await resendWorkspaceInviteForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedInviteId.data,
    parsedLocale.data
  );

  return finalizeWorkspaceAction(response);
}

export async function refreshInviteLinkAction(
  workspaceSlug: string,
  inviteId: string,
  locale: AppLocale
): Promise<
  WorkspaceResponse<{ inviteId: string; expiresAt: string; updatedAt: string; inviteUrl: string }>
> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedInviteId = workspaceIdSchema.safeParse(inviteId);
  const parsedLocale = z.enum(routing.locales).safeParse(locale);

  if (!parsedWorkspaceSlug.success || !parsedInviteId.success || !parsedLocale.success) {
    return createBadRequestWorkspaceResponse();
  }

  const response = await refreshWorkspaceInviteLinkForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedInviteId.data,
    parsedLocale.data
  );

  return finalizeWorkspaceAction(response);
}

export async function revokeInviteAction(
  workspaceSlug: string,
  inviteId: string
): Promise<WorkspaceResponse<{ inviteId: string }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedInviteId = workspaceIdSchema.safeParse(inviteId);

  if (!parsedWorkspaceSlug.success || !parsedInviteId.success) {
    return createBadRequestWorkspaceResponse();
  }

  const response = await revokeWorkspaceInviteForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedInviteId.data
  );

  return finalizeWorkspaceAction(response, {
    mapData: () => ({
      inviteId: parsedInviteId.data,
    }),
  });
}
