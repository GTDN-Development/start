import { toWorkspaceSlug } from "@/features/workspaces/workspace-slug";
import type { WorkspacesRecord } from "@/types/pocketbase";
import { getNullableTrimmedString, hasValidationCode } from "@/server/pocketbase/pocketbase-utils";
import { requireWorkspaceAuthContext } from "@/server/workspaces/workspace-auth-context";
import {
  requireAdminWorkspaceAccessBySlug,
  requireOwnerWorkspaceAccessBySlug,
} from "@/server/workspaces/workspace-access";
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
  countWorkspaceMembers,
  ensureWorkspaceMembership,
  findWorkspaceBySlug,
} from "@/server/workspaces/workspace-repository";
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
  const currentUser = await requireWorkspaceAuthContext();

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
      });
    const membership = await ensureWorkspaceMembership(
      currentUser.context.pb,
      workspace.id,
      currentUser.context.user.id,
      "owner"
    );

    return {
      ok: true,
      data: {
        workspace: mapUserWorkspaceSummary(currentUser.context.pb, workspace, membership, 1),
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
  const currentUser = await requireWorkspaceAuthContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const adminAccess = await requireAdminWorkspaceAccessBySlug(currentUser.context, workspaceSlug);

    if (!adminAccess.ok) {
      return adminAccess.response;
    }

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
      const existingWorkspace = await findWorkspaceBySlug(adminAccess.context.pb, normalizedSlug);

      if (existingWorkspace && existingWorkspace.id !== adminAccess.context.workspace.id) {
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

    const updatedWorkspace = await adminAccess.context.pb
      .collection("workspaces")
      .update<WorkspacesRecord>(adminAccess.context.workspace.id, updateData);

    return {
      ok: true,
      data: {
        workspace: mapUserWorkspaceSummary(
          adminAccess.context.pb,
          updatedWorkspace,
          adminAccess.context.membership,
          await countWorkspaceMembers(adminAccess.context.pb, adminAccess.context.workspace.id)
        ),
        previousSlug: adminAccess.context.workspace.slug,
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
        return "NOT_FOUND";
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
  const currentUser = await requireWorkspaceAuthContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const ownerAccess = await requireOwnerWorkspaceAccessBySlug(currentUser.context, workspaceSlug);

    if (!ownerAccess.ok) {
      return ownerAccess.response;
    }

    await ownerAccess.context.pb.collection("workspaces").delete(ownerAccess.context.workspace.id);

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
        return "NOT_FOUND";
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
