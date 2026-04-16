import type PocketBase from "pocketbase";
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
import {
  requireWorkspaceActionMembershipContext,
  requireWorkspaceMembershipContext,
} from "@/server/workspaces/workspace-resolution-service";
import {
  mapWorkspaceMemberSummary,
  sortWorkspaceMembers,
} from "@/server/workspaces/workspace-mappers";
import {
  countWorkspaceOwners,
  findWorkspaceMemberById,
  listWorkspaceMemberRecordsByWorkspace,
} from "@/server/workspaces/workspace-repository";
import type {
  ServerWorkspaceResponse,
  WorkspaceMemberRole,
  WorkspaceMemberSummary,
} from "@/server/workspaces/workspace-types";

export async function listWorkspaceMembers(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ members: WorkspaceMemberSummary[] }>> {
  const workspaceAccess = await requireWorkspaceMembershipContext(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  const { pb, workspace } = workspaceAccess.context;

  return listWorkspaceMembersWithClient(pb, workspace.id);
}

export async function listWorkspaceMembersWithClient(
  pb: PocketBase,
  workspaceId: string
): Promise<ServerWorkspaceResponse<{ members: WorkspaceMemberSummary[] }>> {
  try {
    const memberRecords = await listWorkspaceMemberRecordsByWorkspace(pb, workspaceId);
    const members = memberRecords
      .map((memberRecord) => mapWorkspaceMemberSummary(pb, memberRecord))
      .filter((value): value is WorkspaceMemberSummary => value !== null)
      .sort(sortWorkspaceMembers);

    return {
      ok: true,
      data: {
        members,
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, (pocketBaseError) => {
      if (pocketBaseError.status === 404) {
        return "NOT_FOUND";
      }

      if (pocketBaseError.status === 403) {
        return "FORBIDDEN";
      }

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("listWorkspaceMembersWithClient", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function leaveWorkspaceForCurrentUser(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ left: true }>> {
  const workspaceAccess = await requireWorkspaceActionMembershipContext(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { pb, membership, workspace } = workspaceAccess.context;

    if (membership.role === "owner") {
      const ownerCount = await countWorkspaceOwners(pb, workspace.id);

      if (ownerCount <= 1) {
        return {
          ok: false,
          errorCode: "LAST_OWNER_GUARD",
        };
      }
    }

    await pb.collection("workspace_members").delete(membership.id);

    return {
      ok: true,
      data: {
        left: true,
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
      logWorkspaceServiceError("leaveWorkspaceForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function changeWorkspaceMemberRoleForCurrentUser(
  workspaceSlug: string,
  memberId: string,
  role: WorkspaceMemberRole
): Promise<ServerWorkspaceResponse<{ updated: true }>> {
  const workspaceAccess = await requireWorkspaceActionMembershipContext(workspaceSlug);

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

    if (memberRecord.role === role) {
      return {
        ok: true,
        data: {
          updated: true,
        },
      };
    }

    if (memberRecord.role === "owner" && role !== "owner") {
      const ownerCount = await countWorkspaceOwners(pb, workspace.id);

      if (ownerCount <= 1) {
        return {
          ok: false,
          errorCode: "LAST_OWNER_GUARD",
        };
      }
    }

    await pb.collection("workspace_members").update(memberRecord.id, {
      role,
    });

    return {
      ok: true,
      data: {
        updated: true,
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

      if (pocketBaseError.status === 404) {
        return "FORBIDDEN";
      }

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("changeWorkspaceMemberRoleForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function removeWorkspaceMemberForCurrentUser(
  workspaceSlug: string,
  memberId: string
): Promise<ServerWorkspaceResponse<{ removed: true }>> {
  const workspaceAccess = await requireWorkspaceActionMembershipContext(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { pb, membership, workspace } = workspaceAccess.context;
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

    if (memberRecord.role === "owner") {
      const ownerCount = await countWorkspaceOwners(pb, workspace.id);

      if (ownerCount <= 1) {
        return {
          ok: false,
          errorCode: "LAST_OWNER_GUARD",
        };
      }
    }

    await pb.collection("workspace_members").delete(memberRecord.id);

    return {
      ok: true,
      data: {
        removed: true,
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
      logWorkspaceServiceError("removeWorkspaceMemberForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}
