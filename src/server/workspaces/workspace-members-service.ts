import { requireWorkspaceAuthContext } from "@/server/workspaces/workspace-auth-context";
import {
  requireAdminWorkspaceAccessBySlug,
  requireWorkspaceAccess,
} from "@/server/workspaces/workspace-access";
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
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
  const currentUser = await requireWorkspaceAuthContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const access = await requireWorkspaceAccess(currentUser.context, workspaceSlug);

    if (!access.ok) {
      return access.response;
    }

    const memberRecords = await listWorkspaceMemberRecordsByWorkspace(
      access.context.pb,
      access.context.workspace.id
    );
    const members = memberRecords
      .map((memberRecord) => mapWorkspaceMemberSummary(access.context.pb, memberRecord))
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
      logWorkspaceServiceError("listWorkspaceMembers", error);
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
  const currentUser = await requireWorkspaceAuthContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const access = await requireWorkspaceAccess(currentUser.context, workspaceSlug);

    if (!access.ok) {
      return access.response;
    }

    if (access.context.membership.role === "owner") {
      const ownerCount = await countWorkspaceOwners(access.context.pb, access.context.workspace.id);

      if (ownerCount <= 1) {
        return {
          ok: false,
          errorCode: "LAST_OWNER_GUARD",
        };
      }
    }

    await access.context.pb.collection("workspace_members").delete(access.context.membership.id);

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
  const currentUser = await requireWorkspaceAuthContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const adminAccess = await requireAdminWorkspaceAccessBySlug(currentUser.context, workspaceSlug);

    if (!adminAccess.ok) {
      return adminAccess.response;
    }

    const memberRecord = await findWorkspaceMemberById(
      adminAccess.context.pb,
      adminAccess.context.workspace.id,
      memberId
    );

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

    if (
      !canManageMemberRole(adminAccess.context.membership.role, memberRecord.role) ||
      !canAssignMemberRole(adminAccess.context.membership.role, role)
    ) {
      return {
        ok: false,
        errorCode: "FORBIDDEN",
      };
    }

    if (memberRecord.role === "owner" && role !== "owner") {
      const ownerCount = await countWorkspaceOwners(
        adminAccess.context.pb,
        adminAccess.context.workspace.id
      );

      if (ownerCount <= 1) {
        return {
          ok: false,
          errorCode: "LAST_OWNER_GUARD",
        };
      }
    }

    await adminAccess.context.pb.collection("workspace_members").update(memberRecord.id, {
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
        return "NOT_FOUND";
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
  const currentUser = await requireWorkspaceAuthContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const adminAccess = await requireAdminWorkspaceAccessBySlug(currentUser.context, workspaceSlug);

    if (!adminAccess.ok) {
      return adminAccess.response;
    }

    const memberRecord = await findWorkspaceMemberById(
      adminAccess.context.pb,
      adminAccess.context.workspace.id,
      memberId
    );

    if (!memberRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (memberRecord.id === adminAccess.context.membership.id) {
      return {
        ok: false,
        errorCode: "FORBIDDEN",
      };
    }

    if (!canManageMemberRole(adminAccess.context.membership.role, memberRecord.role)) {
      return {
        ok: false,
        errorCode: "FORBIDDEN",
      };
    }

    if (memberRecord.role === "owner") {
      const ownerCount = await countWorkspaceOwners(
        adminAccess.context.pb,
        adminAccess.context.workspace.id
      );

      if (ownerCount <= 1) {
        return {
          ok: false,
          errorCode: "LAST_OWNER_GUARD",
        };
      }
    }

    await adminAccess.context.pb.collection("workspace_members").delete(memberRecord.id);

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
        return "NOT_FOUND";
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

function canManageMemberRole(
  actingRole: WorkspaceMemberRole,
  targetRole: WorkspaceMemberRole
): boolean {
  if (actingRole === "owner") {
    return true;
  }

  if (actingRole === "admin") {
    return targetRole !== "owner";
  }

  return false;
}

function canAssignMemberRole(
  actingRole: WorkspaceMemberRole,
  nextRole: WorkspaceMemberRole
): boolean {
  if (actingRole === "owner") {
    return true;
  }

  if (actingRole === "admin") {
    return nextRole !== "owner";
  }

  return false;
}
