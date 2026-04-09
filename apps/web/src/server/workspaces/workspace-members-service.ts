import {
  requireWorkspaceActionContext,
  requireWorkspaceAuthContext,
} from "@/server/workspaces/workspace-auth-context";
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
  findWorkspaceBySlug,
  findWorkspaceMemberById,
  findWorkspaceMembershipByWorkspaceAndUser,
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
    const workspace = await findWorkspaceBySlug(currentUser.context.pb, workspaceSlug);

    if (!workspace) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    const membership = await findWorkspaceMembershipByWorkspaceAndUser(
      currentUser.context.pb,
      workspace.id,
      currentUser.context.user.id
    );

    if (!membership) {
      return {
        ok: false,
        errorCode: "FORBIDDEN",
      };
    }

    const memberRecords = await listWorkspaceMemberRecordsByWorkspace(
      currentUser.context.pb,
      workspace.id
    );
    const members = memberRecords
      .map((memberRecord) => mapWorkspaceMemberSummary(currentUser.context.pb, memberRecord))
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
  const currentUser = await requireWorkspaceActionContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const workspace = await findWorkspaceBySlug(currentUser.context.pb, workspaceSlug);

    if (!workspace) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    const membership = await findWorkspaceMembershipByWorkspaceAndUser(
      currentUser.context.pb,
      workspace.id,
      currentUser.context.user.id
    );

    if (!membership) {
      return {
        ok: false,
        errorCode: "FORBIDDEN",
      };
    }

    if (membership.role === "owner") {
      const ownerCount = await countWorkspaceOwners(currentUser.context.pb, workspace.id);

      if (ownerCount <= 1) {
        return {
          ok: false,
          errorCode: "LAST_OWNER_GUARD",
        };
      }
    }

    await currentUser.context.pb.collection("workspace_members").delete(membership.id);

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
  const currentUser = await requireWorkspaceActionContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const workspace = await findWorkspaceBySlug(currentUser.context.pb, workspaceSlug);

    if (!workspace) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    const membership = await findWorkspaceMembershipByWorkspaceAndUser(
      currentUser.context.pb,
      workspace.id,
      currentUser.context.user.id
    );

    if (!membership) {
      return {
        ok: false,
        errorCode: "FORBIDDEN",
      };
    }

    const memberRecord = await findWorkspaceMemberById(
      currentUser.context.pb,
      workspace.id,
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

    if (memberRecord.role === "owner" && role !== "owner") {
      const ownerCount = await countWorkspaceOwners(currentUser.context.pb, workspace.id);

      if (ownerCount <= 1) {
        return {
          ok: false,
          errorCode: "LAST_OWNER_GUARD",
        };
      }
    }

    await currentUser.context.pb.collection("workspace_members").update(memberRecord.id, {
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
  const currentUser = await requireWorkspaceActionContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const workspace = await findWorkspaceBySlug(currentUser.context.pb, workspaceSlug);

    if (!workspace) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    const membership = await findWorkspaceMembershipByWorkspaceAndUser(
      currentUser.context.pb,
      workspace.id,
      currentUser.context.user.id
    );

    if (!membership) {
      return {
        ok: false,
        errorCode: "FORBIDDEN",
      };
    }

    const memberRecord = await findWorkspaceMemberById(
      currentUser.context.pb,
      workspace.id,
      memberId
    );

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
      const ownerCount = await countWorkspaceOwners(currentUser.context.pb, workspace.id);

      if (ownerCount <= 1) {
        return {
          ok: false,
          errorCode: "LAST_OWNER_GUARD",
        };
      }
    }

    await currentUser.context.pb.collection("workspace_members").delete(memberRecord.id);

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
