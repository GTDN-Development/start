import type PocketBase from "pocketbase";
import { toWorkspaceSlug } from "@/features/workspaces/workspace-slug";
import type { WorkspacesRecord } from "@/types/pocketbase";
import { getNullableTrimmedString, hasValidationCode } from "@/server/pocketbase/pocketbase-utils";
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
import { mapUserWorkspaceSummary } from "@/server/workspaces/workspace-mappers";
import {
  normalizeWorkspaceName,
  resolveUniqueWorkspaceSlug,
} from "@/server/workspaces/workspace-normalization";
import {
  ensureWorkspaceMembership,
  findWorkspaceBySlug,
} from "@/server/workspaces/workspace-repository";
import {
  requireWorkspaceActionContext,
  requireWorkspaceActionMembershipContext,
} from "@/server/workspaces/workspace-resolution-service";
import type { ServerWorkspaceResponse, UserWorkspace } from "@/server/workspaces/workspace-types";

export type CreateWorkspaceInput = {
  name: string;
  slug?: string | null;
};

export type UpdateWorkspaceGeneralInput = {
  name?: string | null;
  slug?: string | null;
  avatarFile?: File | null;
  removeAvatar?: boolean;
};

export async function createWorkspaceForCurrentUser(
  input: CreateWorkspaceInput
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace }>> {
  const currentUser = await requireWorkspaceActionContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const workspaceName = normalizeWorkspaceName(input.name);

    if (!workspaceName) {
      return {
        ok: false,
        errorCode: "BAD_REQUEST",
      };
    }

    const requestedSlug = getNullableTrimmedString(input.slug) ?? workspaceName;
    const workspaceSlug = await resolveUniqueWorkspaceSlug(currentUser.context.pb, requestedSlug);
    const workspace = await currentUser.context.pb
      .collection("workspaces")
      .create<WorkspacesRecord>({
        name: workspaceName,
        slug: workspaceSlug,
        kind: "organization",
        created_by: currentUser.context.user.id,
      });
    let membership: Awaited<ReturnType<typeof ensureWorkspaceMembership>>;

    try {
      membership = await ensureWorkspaceMembership(
        currentUser.context.pb,
        workspace.id,
        currentUser.context.user.id,
        "owner"
      );
    } catch (error) {
      await rollbackWorkspaceAfterFailedMembership(currentUser.context.pb, workspace.id);
      throw error;
    }

    return {
      ok: true,
      data: {
        workspace: mapUserWorkspaceSummary(currentUser.context.pb, workspace, membership),
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, (pocketBaseError) => {
      if (pocketBaseError.status === 400) {
        return "BAD_REQUEST";
      }

      if (pocketBaseError.status === 403) {
        return "FORBIDDEN";
      }

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("createWorkspaceForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function updateWorkspaceGeneralForCurrentUser(
  workspaceSlug: string,
  input: UpdateWorkspaceGeneralInput
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace; previousSlug: string }>> {
  const workspaceAccess = await requireWorkspaceActionMembershipContext(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { pb, membership, workspace } = workspaceAccess.context;

    const updateData: Record<string, string | File | null> = {};

    if (input.name !== undefined) {
      const normalizedName = normalizeWorkspaceName(input.name ?? "");

      if (!normalizedName) {
        return {
          ok: false,
          errorCode: "BAD_REQUEST",
        };
      }

      updateData.name = normalizedName;
    }

    if (input.slug !== undefined) {
      const normalizedSlugInput = getNullableTrimmedString(input.slug);

      if (!normalizedSlugInput) {
        return {
          ok: false,
          errorCode: "BAD_REQUEST",
        };
      }

      const normalizedSlug = toWorkspaceSlug(normalizedSlugInput);
      const existingWorkspace = await findWorkspaceBySlug(pb, normalizedSlug);

      if (existingWorkspace && existingWorkspace.id !== workspace.id) {
        return {
          ok: false,
          errorCode: "SLUG_NOT_AVAILABLE",
        };
      }

      updateData.slug = normalizedSlug;
    }

    if (input.removeAvatar === true) {
      updateData.avatar = null;
    } else if (input.avatarFile) {
      updateData.avatar = input.avatarFile;
    }

    if (Object.keys(updateData).length === 0) {
      return {
        ok: false,
        errorCode: "BAD_REQUEST",
      };
    }

    const updatedWorkspace = await pb
      .collection("workspaces")
      .update<WorkspacesRecord>(workspace.id, updateData);

    return {
      ok: true,
      data: {
        workspace: mapUserWorkspaceSummary(pb, updatedWorkspace, membership),
        previousSlug: workspace.slug,
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, (pocketBaseError) => {
      if (pocketBaseError.status === 400) {
        if (hasValidationCode(pocketBaseError.response?.data, "slug", "validation_not_unique")) {
          return "SLUG_NOT_AVAILABLE";
        }

        return "BAD_REQUEST";
      }

      if (pocketBaseError.status === 403) {
        return "FORBIDDEN";
      }

      if (pocketBaseError.status === 404) {
        return "FORBIDDEN";
      }

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("updateWorkspaceGeneralForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function deleteWorkspaceForCurrentUser(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ deleted: true }>> {
  const workspaceAccess = await requireWorkspaceActionMembershipContext(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { pb, workspace } = workspaceAccess.context;
    await pb.collection("workspaces").delete(workspace.id);

    return {
      ok: true,
      data: {
        deleted: true,
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, (pocketBaseError) => {
      if (pocketBaseError.status === 403) {
        return "FORBIDDEN";
      }

      if (pocketBaseError.status === 404) {
        return "FORBIDDEN";
      }

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("deleteWorkspaceForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

async function rollbackWorkspaceAfterFailedMembership(
  pb: PocketBase,
  workspaceId: string
): Promise<void> {
  try {
    await pb.collection("workspaces").delete(workspaceId);
  } catch (error) {
    logWorkspaceServiceError("rollbackWorkspaceAfterFailedMembership", error);
  }
}
