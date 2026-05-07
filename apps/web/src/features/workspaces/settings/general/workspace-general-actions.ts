"use server";

import { APP_HOME_PATH, getWorkspaceOverviewHref, getWorkspaceSettingsHref } from "@/config/routes";
import {
  createWorkspaceInputSchema,
  updateWorkspaceGeneralInputSchema,
  workspaceAvatarMaxSizeBytes,
  workspaceSlugSchema,
} from "@/features/workspaces/workspace-schemas";
import type {
  WorkspaceNavigationItem,
  WorkspaceNavigationPatch,
} from "@/features/workspaces/workspace-navigation-types";
import {
  clearActiveWorkspaceSlugCookie,
  getActiveWorkspaceSlugCookie,
  setActiveWorkspaceSlugCookie,
} from "@/server/workspaces/workspace-cookie";
import {
  createBadRequestWorkspaceResponse,
  finalizeWorkspaceAction,
} from "@/server/workspaces/workspace-response";
import {
  createWorkspace,
  deleteWorkspace,
  leaveWorkspace,
  updateWorkspaceGeneral,
} from "@/server/workspaces/workspace-general-mutations";
import { resolveAccessibleWorkspaceForCurrentUser } from "@/server/workspaces/workspace-route-queries";
import type { UserWorkspace, WorkspaceResponse } from "@/server/workspaces/workspace-types";

type WorkspaceUpdateInput = {
  name?: string;
  slug?: string;
  removeAvatar?: boolean;
  avatarFile?: File;
};

type WorkspaceNavigationPayload<TData> = TData & {
  navigationPatch: WorkspaceNavigationPatch;
};

export async function createWorkspaceAction(input: {
  name: string;
  slug?: string;
}): Promise<
  WorkspaceResponse<
    WorkspaceNavigationPayload<{ workspaceSlug: string; workspace: WorkspaceNavigationItem }>
  >
> {
  const parsedInput = createWorkspaceInputSchema.safeParse(input);

  if (!parsedInput.success) {
    return createBadRequestWorkspaceResponse();
  }

  const response = await createWorkspace(parsedInput.data);

  return finalizeWorkspaceAction(response, {
    mapData: async (data) => {
      await setActiveWorkspaceSlugCookie(data.workspace.slug);

      return createWorkspaceNavigationPayload(data.workspace, {
        activeWorkspaceSlug: data.workspace.slug,
        redirectHref: getWorkspaceOverviewHref(data.workspace.slug),
      });
    },
  });
}

export async function switchWorkspaceAction(
  workspaceSlug: string
): Promise<
  WorkspaceResponse<WorkspaceNavigationPayload<{ switched: true; workspaceSlug: string }>>
> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);

  if (!parsedWorkspaceSlug.success) {
    return createBadRequestWorkspaceResponse();
  }

  const response = await resolveAccessibleWorkspaceForCurrentUser(parsedWorkspaceSlug.data);

  return finalizeWorkspaceAction(response, {
    mapData: async (data) => {
      await setActiveWorkspaceSlugCookie(data.workspace.slug);

      return {
        switched: true as const,
        ...createWorkspaceNavigationPayload(data.workspace, {
          activeWorkspaceSlug: data.workspace.slug,
          redirectHref: getWorkspaceOverviewHref(data.workspace.slug),
        }),
      };
    },
  });
}

export async function updateWorkspaceGeneralAction(
  workspaceSlug: string,
  input: WorkspaceUpdateInput
): Promise<
  WorkspaceResponse<
    WorkspaceNavigationPayload<{ workspaceSlug: string; workspace: WorkspaceNavigationItem }>
  >
> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);
  const parsedInput = updateWorkspaceGeneralInputSchema.safeParse(input);

  if (!parsedWorkspaceSlug.success || !parsedInput.success) {
    return createBadRequestWorkspaceResponse();
  }

  if (parsedInput.data.avatarFile && !isWorkspaceAvatarFileValid(parsedInput.data.avatarFile)) {
    return createBadRequestWorkspaceResponse();
  }

  const response = await updateWorkspaceGeneral(parsedWorkspaceSlug.data, parsedInput.data);

  return finalizeWorkspaceAction(response, {
    mapData: async (data) => {
      const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();
      const workspaceSlugChanged = data.previousSlug !== data.workspace.slug;
      const shouldUpdateActiveWorkspaceCookie =
        workspaceSlugChanged &&
        (activeWorkspaceSlug === data.previousSlug ||
          (!activeWorkspaceSlug && parsedWorkspaceSlug.data === data.previousSlug));

      if (shouldUpdateActiveWorkspaceCookie) {
        await setActiveWorkspaceSlugCookie(data.workspace.slug);
      }

      return createWorkspaceNavigationPayload(data.workspace, {
        ...(shouldUpdateActiveWorkspaceCookie ? { activeWorkspaceSlug: data.workspace.slug } : {}),
        ...(workspaceSlugChanged
          ? { redirectHref: getWorkspaceSettingsHref(data.workspace.slug) }
          : {}),
      });
    },
  });
}

export async function leaveWorkspaceAction(
  workspaceSlug: string
): Promise<WorkspaceResponse<WorkspaceNavigationPayload<{ left: true }>>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);

  if (!parsedWorkspaceSlug.success) {
    return createBadRequestWorkspaceResponse();
  }

  return finalizeWorkspaceAction(await leaveWorkspace(parsedWorkspaceSlug.data), {
    mapData: async (data) => ({
      left: true as const,
      ...(await createWorkspaceRemovalPayload(data.workspaceId, parsedWorkspaceSlug.data)),
    }),
  });
}

export async function deleteWorkspaceAction(
  workspaceSlug: string
): Promise<WorkspaceResponse<WorkspaceNavigationPayload<{ deleted: true }>>> {
  const parsedWorkspaceSlug = workspaceSlugSchema.safeParse(workspaceSlug);

  if (!parsedWorkspaceSlug.success) {
    return createBadRequestWorkspaceResponse();
  }

  return finalizeWorkspaceAction(await deleteWorkspace(parsedWorkspaceSlug.data), {
    mapData: async (data) => ({
      deleted: true as const,
      ...(await createWorkspaceRemovalPayload(data.workspaceId, parsedWorkspaceSlug.data)),
    }),
  });
}

function isWorkspaceAvatarFileValid(avatarFile: File): boolean {
  return avatarFile.type.startsWith("image/") && avatarFile.size <= workspaceAvatarMaxSizeBytes;
}

function createWorkspaceNavigationPayload(
  workspace: UserWorkspace,
  patch: Omit<WorkspaceNavigationPatch, "upsertWorkspace"> = {}
) {
  const navigationItem: WorkspaceNavigationItem = {
    id: workspace.id,
    slug: workspace.slug,
    name: workspace.name,
    role: workspace.role,
    avatarUrl: workspace.avatarUrl,
  };

  return {
    workspaceSlug: workspace.slug,
    workspace: navigationItem,
    navigationPatch: {
      upsertWorkspace: navigationItem,
      ...patch,
    },
  };
}

async function createWorkspaceRemovalPayload(workspaceId: string, workspaceSlug: string) {
  const shouldClearActiveWorkspace = (await getActiveWorkspaceSlugCookie()) === workspaceSlug;

  if (shouldClearActiveWorkspace) {
    await clearActiveWorkspaceSlugCookie();
  }

  return {
    navigationPatch: {
      removeWorkspaceId: workspaceId,
      ...(shouldClearActiveWorkspace ? { activeWorkspaceSlug: null } : {}),
      redirectHref: APP_HOME_PATH,
    },
  };
}
