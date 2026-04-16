"use server";

import {
  createWorkspaceInputSchema,
  updateWorkspaceGeneralInputSchema,
  workspaceAvatarMaxSizeBytes,
  workspaceSlugSchema,
} from "@/features/workspaces/workspace-schemas";
import type { WorkspaceNavigationItem } from "@/features/workspaces/workspace-navigation-types";
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
import {
  createBadRequestWorkspaceResponse,
  finalizeWorkspaceAction,
} from "@/server/workspaces/workspace-response";
import { resolveAccessibleWorkspaceForCurrentUser } from "@/server/workspaces/workspace-resolution-service";
import type { UserWorkspace, WorkspaceResponse } from "@/server/workspaces/workspace-types";

export async function createWorkspaceAction(input: {
  name: string;
  slug?: string;
}): Promise<WorkspaceResponse<{ workspaceSlug: string; workspace: WorkspaceNavigationItem }>> {
  const parsedInput = createWorkspaceInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestWorkspaceResponse();
  }

  const response = await createWorkspaceForCurrentUser(parsedInput.data);

  return finalizeWorkspaceAction(response, {
    onSuccess: async (data) => {
      await setActiveWorkspaceSlugCookie(data.workspace.slug);
    },
    mapData: (data) => ({
      workspaceSlug: data.workspace.slug,
      workspace: mapWorkspaceNavigationItem(data.workspace),
    }),
  });
}

export async function switchWorkspaceAction(
  workspaceSlug: string
): Promise<WorkspaceResponse<{ switched: true; workspaceSlug: string }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);

  if (!parsedWorkspaceSlug.success) {
    return createBadRequestWorkspaceResponse();
  }

  const response = await resolveAccessibleWorkspaceForCurrentUser(parsedWorkspaceSlug.data);

  return finalizeWorkspaceAction(response, {
    onSuccess: async (data) => {
      await setActiveWorkspaceSlugCookie(data.workspace.slug);
    },
    mapData: (data) => ({
      switched: true as const,
      workspaceSlug: data.workspace.slug,
    }),
  });
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
    return createBadRequestWorkspaceResponse();
  }

  if (parsedInput.data.avatarFile && !isWorkspaceAvatarFileValid(parsedInput.data.avatarFile)) {
    return createBadRequestWorkspaceResponse();
  }

  const response = await updateWorkspaceGeneralForCurrentUser(
    parsedWorkspaceSlug.data,
    parsedInput.data
  );

  return finalizeWorkspaceAction(response, {
    onSuccess: async (data) => {
      const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();
      const workspaceSlugChanged = data.previousSlug !== data.workspace.slug;
      const isCurrentWorkspaceRoute = parsedWorkspaceSlug.data === data.previousSlug;
      const shouldUpdateActiveWorkspaceCookie =
        workspaceSlugChanged &&
        (activeWorkspaceSlug === data.previousSlug ||
          (!activeWorkspaceSlug && isCurrentWorkspaceRoute));

      if (shouldUpdateActiveWorkspaceCookie) {
        await setActiveWorkspaceSlugCookie(data.workspace.slug);
      }
    },
    mapData: (data) => ({
      workspaceSlug: data.workspace.slug,
      workspace: mapWorkspaceNavigationItem(data.workspace),
    }),
  });
}

export async function leaveWorkspaceAction(
  workspaceSlug: string
): Promise<WorkspaceResponse<{ left: true }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);

  if (!parsedWorkspaceSlug.success) {
    return createBadRequestWorkspaceResponse();
  }

  return finalizeWorkspaceAction(await leaveWorkspaceForCurrentUser(parsedWorkspaceSlug.data), {
    onSuccess: async () => {
      await clearActiveWorkspaceCookieIfNeeded(parsedWorkspaceSlug.data);
    },
  });
}

export async function deleteWorkspaceAction(
  workspaceSlug: string
): Promise<WorkspaceResponse<{ deleted: true }>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);

  if (!parsedWorkspaceSlug.success) {
    return createBadRequestWorkspaceResponse();
  }

  return finalizeWorkspaceAction(await deleteWorkspaceForCurrentUser(parsedWorkspaceSlug.data), {
    onSuccess: async () => {
      await clearActiveWorkspaceCookieIfNeeded(parsedWorkspaceSlug.data);
    },
  });
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

async function clearActiveWorkspaceCookieIfNeeded(workspaceSlug: string): Promise<void> {
  const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();

  if (activeWorkspaceSlug === workspaceSlug) {
    await clearActiveWorkspaceSlugCookie();
  }
}

function mapWorkspaceNavigationItem(workspace: UserWorkspace): WorkspaceNavigationItem {
  return {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    role: workspace.role,
    avatarUrl: workspace.avatarUrl,
  };
}
