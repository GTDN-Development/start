"use server";

import { revalidatePath } from "next/cache";
import { APP_HOME_PATH, getWorkspaceOverviewPath, getWorkspaceSettingsPath } from "@/config/routes";
import {
  createWorkspaceInputSchema,
  updateWorkspaceGeneralInputSchema,
  workspaceAvatarMaxSizeBytes,
  workspaceSlugSchema,
} from "@/features/workspaces/workspace-schemas";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-navigation-types";
import { applyServerActionAuthCookies } from "@/server/auth/auth-cookies";
import {
  clearActiveWorkspaceSlugCookie,
  getActiveWorkspaceSlugCookie,
  setActiveWorkspaceSlugCookie,
} from "@/server/workspaces/workspace-cookie";
import {
  createWorkspaceForCurrentUser,
  deleteWorkspaceForCurrentUser,
  updateWorkspaceGeneralForCurrentUser,
} from "@/server/workspaces/workspace-general-service";
import { leaveWorkspaceForCurrentUser } from "@/server/workspaces/workspace-members-service";
import { switchWorkspaceForCurrentUser } from "@/server/workspaces/workspace-resolution-service";
import type {
  ServerWorkspaceResponse,
  UserWorkspace,
  WorkspaceResponse,
} from "@/server/workspaces/workspace-types";

export async function createWorkspaceAction(input: {
  name: string;
  slug?: string;
}): Promise<WorkspaceResponse<{ workspaceSlug: string }>> {
  const parsedInput = createWorkspaceInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestResponse();
  }

  const response = await createWorkspaceForCurrentUser(parsedInput.data);

  if (response.ok) {
    await setActiveWorkspaceSlugCookie(response.data.workspace.slug);
    revalidatePath(APP_HOME_PATH);
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
    revalidatePath(APP_HOME_PATH);
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
): Promise<WorkspaceResponse<{ workspaceSlug: string; workspace: WorkspaceNavigationItem }>> {
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
    const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();
    const workspaceSlugChanged = response.data.previousSlug !== response.data.workspace.slug;
    const isCurrentWorkspaceRoute = parsedWorkspaceSlug.data === response.data.previousSlug;
    const shouldUpdateActiveWorkspaceCookie =
      workspaceSlugChanged &&
      (activeWorkspaceSlug === response.data.previousSlug ||
        (!activeWorkspaceSlug && isCurrentWorkspaceRoute));

    if (shouldUpdateActiveWorkspaceCookie) {
      await setActiveWorkspaceSlugCookie(response.data.workspace.slug);
    }

    if (workspaceSlugChanged) {
      revalidateWorkspaceGeneralPaths(response.data.previousSlug, response.data.workspace.slug);
    }
  }

  return finalizeWorkspaceAction(response, (data) => ({
    workspaceSlug: data.workspace.slug,
    workspace: mapWorkspaceNavigationItem(data.workspace),
  }));
}

export async function leaveWorkspaceAction(
  workspaceSlug: string
): Promise<WorkspaceResponse<{ left: true }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);

  if (!parsedWorkspaceSlug.success) {
    return createBadRequestResponse();
  }

  const response = await deleteActiveWorkspaceCookieAfterSuccess(
    await leaveWorkspaceForCurrentUser(parsedWorkspaceSlug.data)
  );

  return finalizeWorkspaceAction(response);
}

export async function deleteWorkspaceAction(
  workspaceSlug: string
): Promise<WorkspaceResponse<{ deleted: true }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);

  if (!parsedWorkspaceSlug.success) {
    return createBadRequestResponse();
  }

  const response = await deleteActiveWorkspaceCookieAfterSuccess(
    await deleteWorkspaceForCurrentUser(parsedWorkspaceSlug.data)
  );

  return finalizeWorkspaceAction(response);
}

async function deleteActiveWorkspaceCookieAfterSuccess<TData>(
  response: ServerWorkspaceResponse<TData>
) {
  if (response.ok) {
    await clearActiveWorkspaceSlugCookie();
    revalidatePath(APP_HOME_PATH);
  }

  return response;
}

async function finalizeWorkspaceAction<TData, TResult = TData>(
  response: ServerWorkspaceResponse<TData>,
  mapData?: (data: TData) => TResult
): Promise<WorkspaceResponse<TResult>> {
  await applyServerActionAuthCookies(response.setCookie);

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

  if (avatarFile.size > workspaceAvatarMaxSizeBytes) {
    return false;
  }

  return true;
}

function revalidateWorkspaceGeneralPaths(currentSlug: string, nextSlug: string): void {
  revalidatePath(getWorkspaceSettingsPath(currentSlug));
  revalidatePath(getWorkspaceOverviewPath(currentSlug));

  if (currentSlug !== nextSlug) {
    revalidatePath(getWorkspaceSettingsPath(nextSlug));
    revalidatePath(getWorkspaceOverviewPath(nextSlug));
  }
}

function mapWorkspaceNavigationItem(workspace: UserWorkspace): WorkspaceNavigationItem {
  return {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    role: workspace.role,
    avatarUrl: workspace.avatarUrl,
    memberCount: workspace.memberCount,
  };
}
