"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import {
  MAX_WORKSPACE_AVATAR_SIZE_BYTES,
  MAX_WORKSPACE_NAME_LENGTH,
  MAX_WORKSPACE_SLUG_LENGTH,
  WORKSPACE_INVITABLE_ROLE_VALUES,
  WORKSPACE_MEMBER_ROLE_VALUES,
  WORKSPACE_SLUG_PATTERN,
} from "@/config/workspace";
import { applyServerAuthCookies } from "@/server/auth/auth-cookies";
import { getServerAuthSession } from "@/server/auth/auth-service";
import {
  clearActiveWorkspaceSlugCookie,
  getActiveWorkspaceSlugCookie,
  setActiveWorkspaceSlugCookie,
  setPendingInviteHashCookie,
} from "@/server/workspaces/workspace-cookie";
import {
  createOrganizationWorkspaceForCurrentUser,
  deleteOrganizationWorkspaceForCurrentUser,
  resolvePostAuthWorkspace,
  switchWorkspaceForCurrentUser,
  updateWorkspaceGeneralForCurrentUser,
} from "@/server/workspaces/workspace-general-service";
import {
  changeWorkspaceMemberRoleForCurrentUser,
  leaveWorkspaceForCurrentUser,
  removeWorkspaceMemberForCurrentUser,
  transferWorkspaceOwnershipForCurrentUser,
} from "@/server/workspaces/workspace-members-service";
import {
  createWorkspaceInviteForCurrentUser,
  resendWorkspaceInviteForCurrentUser,
  revokeWorkspaceInviteForCurrentUser,
} from "@/server/workspaces/workspace-invite-service";
import type {
  ServerWorkspaceResponse,
  WorkspaceResponse,
} from "@/server/workspaces/workspace-types";

const workspaceSlugSchema = z
  .string()
  .trim()
  .min(1)
  .max(MAX_WORKSPACE_SLUG_LENGTH)
  .regex(WORKSPACE_SLUG_PATTERN);
const workspaceIdSchema = z.string().trim().min(1);

const createOrganizationWorkspaceInputSchema = z.object({
  name: z.string().trim().min(1).max(MAX_WORKSPACE_NAME_LENGTH),
  slug: workspaceSlugSchema.optional(),
});

const updateWorkspaceGeneralInputSchema = z
  .object({
    name: z.string().trim().min(1).max(MAX_WORKSPACE_NAME_LENGTH).optional(),
    slug: workspaceSlugSchema.optional(),
    removeAvatar: z.boolean().optional(),
    avatarFile: z.custom<File>((value) => value instanceof File).optional(),
  })
  .superRefine((value, context) => {
    if (
      value.name === undefined &&
      value.slug === undefined &&
      value.removeAvatar !== true &&
      value.avatarFile === undefined
    ) {
      context.addIssue({
        code: "custom",
      });
    }

    if (value.avatarFile && value.removeAvatar === true) {
      context.addIssue({
        code: "custom",
        path: ["avatarFile"],
      });
    }
  });

const workspaceMemberRoleSchema = z.enum(WORKSPACE_MEMBER_ROLE_VALUES);

const createInviteInputSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
  role: z.enum(WORKSPACE_INVITABLE_ROLE_VALUES),
});

const pendingInviteHashInputSchema = z.object({
  inviteHash: z
    .string()
    .trim()
    .regex(/^[a-f0-9]{64}$/),
});

export async function createOrganizationWorkspaceAction(input: {
  name: string;
  slug?: string;
}): Promise<WorkspaceResponse<{ workspaceSlug: string }>> {
  const parsedInput = createOrganizationWorkspaceInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse();
  }

  const response = await createOrganizationWorkspaceForCurrentUser(parsedInput.data);

  if (response.ok) {
    await setActiveWorkspaceSlugCookie(response.data.workspace.slug);
    revalidatePath("/overview");
  }

  return finalizeWorkspaceAction(response, (data) => ({
    workspaceSlug: data.workspace.slug,
  }));
}

export async function switchWorkspaceAction(
  workspaceSlug: string
): Promise<WorkspaceResponse<{ switched: true; workspaceSlug: string }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);

  if (!parsedWorkspaceSlug.success) {
    return createBadRequestResponse();
  }

  const response = await switchWorkspaceForCurrentUser(parsedWorkspaceSlug.data);

  if (response.ok) {
    await setActiveWorkspaceSlugCookie(response.data.workspace.slug);
    revalidatePath("/overview");
  }

  return finalizeWorkspaceAction(response, (data) => ({
    switched: true as const,
    workspaceSlug: data.workspace.slug,
  }));
}

export async function updateWorkspaceGeneralAction(
  workspaceSlug: string,
  input: {
    name?: string;
    slug?: string;
    removeAvatar?: boolean;
    avatarFile?: File;
  }
): Promise<WorkspaceResponse<{ workspaceSlug: string }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedInput = updateWorkspaceGeneralInputSchema.safeParse(input);

  if (!parsedWorkspaceSlug.success || !parsedInput.success) {
    return createBadRequestResponse();
  }

  if (parsedInput.data.avatarFile && !isWorkspaceAvatarFileValid(parsedInput.data.avatarFile)) {
    return createBadRequestResponse();
  }

  const response = await updateWorkspaceGeneralForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedInput.data
  );

  if (response.ok) {
    await setActiveWorkspaceSlugCookie(response.data.workspace.slug);
    revalidateWorkspaceGeneralPaths(response.data.previousSlug, response.data.workspace.slug);
  }

  return finalizeWorkspaceAction(response, (data) => ({
    workspaceSlug: data.workspace.slug,
  }));
}

export async function leaveWorkspaceAction(
  workspaceSlug: string
): Promise<WorkspaceResponse<{ left: true }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);

  if (!parsedWorkspaceSlug.success) {
    return createBadRequestResponse();
  }

  const response = await leaveWorkspaceForCurrentUser(parsedWorkspaceSlug.data);

  if (response.ok) {
    await clearActiveWorkspaceSlugCookie();
    revalidatePath("/overview");
  }

  return finalizeWorkspaceAction(response);
}

export async function deleteOrganizationWorkspaceAction(
  workspaceSlug: string
): Promise<WorkspaceResponse<{ deleted: true }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);

  if (!parsedWorkspaceSlug.success) {
    return createBadRequestResponse();
  }

  const response = await deleteOrganizationWorkspaceForCurrentUser(parsedWorkspaceSlug.data);

  if (response.ok) {
    await clearActiveWorkspaceSlugCookie();
    revalidatePath("/overview");
  }

  return finalizeWorkspaceAction(response);
}

export async function changeMemberRoleAction(
  workspaceSlug: string,
  memberId: string,
  role: "owner" | "member"
): Promise<WorkspaceResponse<{ updated: true }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedMemberId = workspaceIdSchema.safeParse(memberId);
  const parsedRole = workspaceMemberRoleSchema.safeParse(role);

  if (!parsedWorkspaceSlug.success || !parsedMemberId.success || !parsedRole.success) {
    return createBadRequestResponse();
  }

  const response = await changeWorkspaceMemberRoleForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedMemberId.data,
    parsedRole.data
  );

  if (response.ok) {
    revalidateWorkspaceMembersPath(parsedWorkspaceSlug.data);
  }

  return finalizeWorkspaceAction(response);
}

export async function removeMemberAction(
  workspaceSlug: string,
  memberId: string
): Promise<WorkspaceResponse<{ removed: true }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedMemberId = workspaceIdSchema.safeParse(memberId);

  if (!parsedWorkspaceSlug.success || !parsedMemberId.success) {
    return createBadRequestResponse();
  }

  const response = await removeWorkspaceMemberForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedMemberId.data
  );

  if (response.ok) {
    revalidateWorkspaceMembersPath(parsedWorkspaceSlug.data);
  }

  return finalizeWorkspaceAction(response);
}

export async function transferOwnershipAction(
  workspaceSlug: string,
  targetMemberId: string
): Promise<WorkspaceResponse<{ transferred: true }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedTargetMemberId = workspaceIdSchema.safeParse(targetMemberId);

  if (!parsedWorkspaceSlug.success || !parsedTargetMemberId.success) {
    return createBadRequestResponse();
  }

  const response = await transferWorkspaceOwnershipForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedTargetMemberId.data
  );

  if (response.ok) {
    revalidateWorkspaceMembersPath(parsedWorkspaceSlug.data);
  }

  return finalizeWorkspaceAction(response);
}

export async function createInviteAction(
  workspaceSlug: string,
  input: {
    email: string;
    role: "member";
  }
): Promise<WorkspaceResponse<{ created: true }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedInput = createInviteInputSchema.safeParse(input);

  if (!parsedWorkspaceSlug.success || !parsedInput.success) {
    return createBadRequestResponse();
  }

  const response = await createWorkspaceInviteForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedInput.data
  );

  if (response.ok) {
    revalidateWorkspaceMembersPath(parsedWorkspaceSlug.data);
  }

  return finalizeWorkspaceAction(response);
}

export async function resendInviteAction(
  workspaceSlug: string,
  inviteId: string
): Promise<WorkspaceResponse<{ resent: true }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedInviteId = workspaceIdSchema.safeParse(inviteId);

  if (!parsedWorkspaceSlug.success || !parsedInviteId.success) {
    return createBadRequestResponse();
  }

  const response = await resendWorkspaceInviteForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedInviteId.data
  );

  if (response.ok) {
    revalidateWorkspaceMembersPath(parsedWorkspaceSlug.data);
  }

  return finalizeWorkspaceAction(response);
}

export async function revokeInviteAction(
  workspaceSlug: string,
  inviteId: string
): Promise<WorkspaceResponse<{ revoked: true }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedInviteId = workspaceIdSchema.safeParse(inviteId);

  if (!parsedWorkspaceSlug.success || !parsedInviteId.success) {
    return createBadRequestResponse();
  }

  const response = await revokeWorkspaceInviteForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedInviteId.data
  );

  if (response.ok) {
    revalidateWorkspaceMembersPath(parsedWorkspaceSlug.data);
  }

  return finalizeWorkspaceAction(response);
}

export async function setPendingInviteHashAction(input: {
  inviteHash: string;
}): Promise<WorkspaceResponse<{ stored: true }>> {
  const parsedInput = pendingInviteHashInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse();
  }

  await setPendingInviteHashCookie(parsedInput.data.inviteHash);

  return {
    ok: true,
    data: {
      stored: true,
    },
  };
}

export async function resolvePostAuthWorkspaceAction(): Promise<
  WorkspaceResponse<{ workspaceSlug: string }>
> {
  const sessionResponse = await getServerAuthSession();

  if (!sessionResponse.ok || !sessionResponse.data.session) {
    return {
      ok: false,
      errorCode: "UNAUTHORIZED",
    };
  }

  const session = sessionResponse.data.session;
  const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();
  const response = await resolvePostAuthWorkspace({
    userId: session.user.id,
    userEmail: session.user.email,
    userName: session.user.name,
    activeWorkspaceSlugCookie: activeWorkspaceSlug,
  });
  await applyServerAuthCookies(response.setCookie);

  if (!response.ok) {
    return {
      ok: false,
      errorCode: response.errorCode,
    };
  }

  await setActiveWorkspaceSlugCookie(response.data.workspaceSlug);

  return {
    ok: true,
    data: {
      workspaceSlug: response.data.workspaceSlug,
    },
  };
}

async function finalizeWorkspaceAction<TData, TResult = TData>(
  response: ServerWorkspaceResponse<TData>,
  mapData?: (data: TData) => TResult
): Promise<WorkspaceResponse<TResult>> {
  await applyServerAuthCookies(response.setCookie);

  if (!response.ok) {
    return {
      ok: false,
      errorCode: response.errorCode,
    };
  }

  return {
    ok: true,
    data: mapData ? mapData(response.data) : (response.data as unknown as TResult),
  };
}

function createBadRequestResponse<TData>(): WorkspaceResponse<TData> {
  return {
    ok: false,
    errorCode: "BAD_REQUEST",
  };
}

function isWorkspaceAvatarFileValid(avatarFile: File): boolean {
  if (!avatarFile.type.startsWith("image/")) {
    return false;
  }

  if (avatarFile.size > MAX_WORKSPACE_AVATAR_SIZE_BYTES) {
    return false;
  }

  return true;
}

function revalidateWorkspaceGeneralPaths(currentSlug: string, nextSlug: string): void {
  revalidatePath(`/w/${currentSlug}/settings`);
  revalidatePath(`/w/${currentSlug}/overview`);

  if (currentSlug !== nextSlug) {
    revalidatePath(`/w/${nextSlug}/settings`);
    revalidatePath(`/w/${nextSlug}/overview`);
  }
}

function revalidateWorkspaceMembersPath(workspaceSlug: string): void {
  revalidatePath(`/w/${workspaceSlug}/settings/members`);
}
