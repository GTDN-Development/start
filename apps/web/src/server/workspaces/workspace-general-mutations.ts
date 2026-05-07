import type { WorkspacesRecord } from "@/types/pocketbase";
import { toWorkspaceSlug } from "@/features/workspaces/workspace-slug";
import { getNullableTrimmedString, hasValidationCode } from "@/server/pocketbase/pocketbase-utils";
import { requireCurrentWritableUser } from "@/server/auth/auth-session-service";
import { mapUserWorkspaceSummary } from "@/server/workspaces/workspace-mappers";
import {
  isLastOwnerGuardError,
  mapMutationStatusError,
} from "@/server/workspaces/workspace-mutation-utils";
import { normalizeWorkspaceName } from "@/server/workspaces/workspace-normalization";
import { resolveWorkspaceActionAccess } from "@/server/workspaces/workspace-route-queries";
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

export async function createWorkspace(
  input: CreateWorkspaceInput
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace }>> {
  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.cookieMutations ? { cookieMutations: currentUser.cookieMutations } : {}),
    };
  }

  try {
    const response = await currentUser.pb.send<{ workspace: UserWorkspace }>(
      "/api/start/workspaces",
      {
        method: "POST",
        body: {
          name: input.name,
          ...(input.slug ? { slug: input.slug } : {}),
        },
      }
    );

    return {
      ok: true,
      data: {
        workspace: response.workspace,
      },
    };
  } catch (error) {
    return mapMutationStatusError("createWorkspace", error, {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
    });
  }
}

export async function updateWorkspaceGeneral(
  workspaceSlug: string,
  input: UpdateWorkspaceGeneralInput
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace; previousSlug: string }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);

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

      updateData.slug = toWorkspaceSlug(normalizedSlugInput);
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
    return mapMutationStatusError(
      "updateWorkspaceGeneral",
      error,
      { 400: "BAD_REQUEST", 403: "FORBIDDEN", 404: "FORBIDDEN" },
      (pocketBaseError) => {
        return hasValidationCode(pocketBaseError.response?.data, "slug", "validation_not_unique")
          ? "SLUG_NOT_AVAILABLE"
          : null;
      }
    );
  }
}

export async function deleteWorkspace(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ deleted: true; workspaceId: string }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    await workspaceAccess.context.pb
      .collection("workspaces")
      .delete(workspaceAccess.context.workspace.id);

    return {
      ok: true,
      data: {
        deleted: true,
        workspaceId: workspaceAccess.context.workspace.id,
      },
    };
  } catch (error) {
    return mapMutationStatusError("deleteWorkspace", error, {
      403: "FORBIDDEN",
      404: "FORBIDDEN",
    });
  }
}

export async function leaveWorkspace(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ left: true; workspaceId: string }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    await workspaceAccess.context.pb
      .collection("workspace_members")
      .delete(workspaceAccess.context.membership.id);

    return {
      ok: true,
      data: {
        left: true,
        workspaceId: workspaceAccess.context.workspace.id,
      },
    };
  } catch (error) {
    return mapMutationStatusError(
      "leaveWorkspace",
      error,
      { 403: "FORBIDDEN", 404: "NOT_FOUND" },
      (pocketBaseError) => (isLastOwnerGuardError(pocketBaseError) ? "LAST_OWNER_GUARD" : null)
    );
  }
}
