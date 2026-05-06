import type { WorkspacesRecord } from "@/types/pocketbase";
import { toWorkspaceSlug } from "@/features/workspaces/workspace-slug";
import { getNullableTrimmedString, hasValidationCode } from "@/server/pocketbase/pocketbase-utils";
import { requireCurrentWritableUser } from "@/server/auth/auth-session-service";
import { mapUserWorkspaceSummary } from "@/server/workspaces/workspace-mappers";
import {
  mapMutationError,
  isLastOwnerGuardError,
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
    return mapMutationError(
      "workspaceMutations.createWorkspace",
      error,
      function mapCreateError(pocketBaseError) {
        if (pocketBaseError.status === 400) {
          return "BAD_REQUEST";
        }

        if (pocketBaseError.status === 401) {
          return "UNAUTHORIZED";
        }

        if (pocketBaseError.status === 403) {
          return "FORBIDDEN";
        }

        return null;
      }
    );
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
    return mapMutationError(
      "workspaceMutations.updateWorkspaceGeneral",
      error,
      function mapError(pocketBaseError) {
        if (pocketBaseError.status === 400) {
          if (hasValidationCode(pocketBaseError.response?.data, "slug", "validation_not_unique")) {
            return "SLUG_NOT_AVAILABLE";
          }

          return "BAD_REQUEST";
        }

        if (pocketBaseError.status === 403 || pocketBaseError.status === 404) {
          return "FORBIDDEN";
        }

        return null;
      }
    );
  }
}

export async function deleteWorkspace(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ deleted: true }>> {
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
      },
    };
  } catch (error) {
    return mapMutationError(
      "workspaceMutations.deleteWorkspace",
      error,
      function mapError(pocketBaseError) {
        if (pocketBaseError.status === 403 || pocketBaseError.status === 404) {
          return "FORBIDDEN";
        }

        return null;
      }
    );
  }
}

export async function leaveWorkspace(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ left: true }>> {
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
      },
    };
  } catch (error) {
    return mapMutationError(
      "workspaceMutations.leaveWorkspace",
      error,
      function mapError(pocketBaseError) {
        if (isLastOwnerGuardError(pocketBaseError)) {
          return "LAST_OWNER_GUARD";
        }

        if (pocketBaseError.status === 403) {
          return "FORBIDDEN";
        }

        if (pocketBaseError.status === 404) {
          return "NOT_FOUND";
        }

        return null;
      }
    );
  }
}
