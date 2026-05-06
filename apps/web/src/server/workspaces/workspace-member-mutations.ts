import {
  findWorkspaceMemberById,
  isLastOwnerGuardError,
  mapMutationError,
} from "@/server/workspaces/workspace-mutation-utils";
import { resolveWorkspaceActionAccess } from "@/server/workspaces/workspace-route-queries";
import type {
  ServerWorkspaceResponse,
  WorkspaceMemberRole,
} from "@/server/workspaces/workspace-types";

export async function changeMemberRole(
  workspaceSlug: string,
  memberId: string,
  role: WorkspaceMemberRole
): Promise<ServerWorkspaceResponse<{ updated: true }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { pb, workspace } = workspaceAccess.context;
    const memberRecord = await findWorkspaceMemberById(pb, workspace.id, memberId);

    if (!memberRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (memberRecord.role !== role) {
      await pb.collection("workspace_members").update(memberRecord.id, {
        role,
      });
    }

    return {
      ok: true,
      data: {
        updated: true,
      },
    };
  } catch (error) {
    return mapMutationError(
      "workspaceMutations.changeMemberRole",
      error,
      function mapError(pocketBaseError) {
        if (isLastOwnerGuardError(pocketBaseError)) {
          return "LAST_OWNER_GUARD";
        }

        if (pocketBaseError.status === 400) {
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

export async function removeMember(
  workspaceSlug: string,
  memberId: string
): Promise<ServerWorkspaceResponse<{ removed: true }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { membership, pb, workspace } = workspaceAccess.context;
    const memberRecord = await findWorkspaceMemberById(pb, workspace.id, memberId);

    if (!memberRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (memberRecord.id === membership.id) {
      return {
        ok: false,
        errorCode: "FORBIDDEN",
      };
    }

    await pb.collection("workspace_members").delete(memberRecord.id);

    return {
      ok: true,
      data: {
        removed: true,
      },
    };
  } catch (error) {
    return mapMutationError(
      "workspaceMutations.removeMember",
      error,
      function mapError(pocketBaseError) {
        if (isLastOwnerGuardError(pocketBaseError)) {
          return "LAST_OWNER_GUARD";
        }

        if (pocketBaseError.status === 403 || pocketBaseError.status === 404) {
          return "FORBIDDEN";
        }

        return null;
      }
    );
  }
}
