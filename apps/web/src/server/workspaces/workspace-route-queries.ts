import PocketBase, { ClientResponseError } from "pocketbase";
import type { UsersRecord, WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";
import { requireCurrentUser, requireCurrentWritableUser } from "@/server/auth/auth-session-service";
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
import { mapUserWorkspaceSummary } from "@/server/workspaces/workspace-mappers";
import type {
  ServerWorkspaceResponse,
  UserWorkspace,
  WorkspaceErrorCode,
} from "@/server/workspaces/workspace-types";

export type WorkspaceAuthContext = {
  pb: PocketBase;
  user: UsersRecord;
};

export type WorkspaceMembershipContext = WorkspaceAuthContext & {
  membership: WorkspaceMembersRecord;
  workspace: WorkspacesRecord;
};

export type WorkspaceRouteAccessContext = WorkspaceAuthContext & {
  workspace: UserWorkspace;
};

type WorkspaceAuthContextResult =
  | {
      ok: true;
      context: WorkspaceAuthContext;
    }
  | {
      ok: false;
      response: ServerWorkspaceResponse<never>;
    };

type WorkspaceMembershipContextResult =
  | {
      ok: true;
      context: WorkspaceMembershipContext;
    }
  | {
      ok: false;
      response: ServerWorkspaceResponse<never>;
    };

type WorkspaceMembershipLookup =
  | {
      state: "workspace_not_found";
    }
  | {
      state: "membership_not_found";
    }
  | {
      state: "ready";
      membership: WorkspaceMembersRecord;
      workspace: WorkspacesRecord;
    };

export async function resolveWorkspaceRouteAccess(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<WorkspaceRouteAccessContext>> {
  const workspaceAccess = await requireWorkspaceMembershipContext(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  const { pb, user, membership, workspace } = workspaceAccess.context;

  return {
    ok: true,
    data: {
      pb,
      user,
      workspace: mapUserWorkspaceSummary(pb, workspace, membership),
    },
  };
}

export async function resolveWorkspaceActionAccess(
  workspaceSlug: string
): Promise<WorkspaceMembershipContextResult> {
  return resolveWorkspaceMembershipContext(
    await requireWorkspaceContext("action"),
    workspaceSlug,
    "resolveWorkspaceActionAccess"
  );
}

export async function resolveAccessibleWorkspaceForCurrentUser(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  const { pb, membership, workspace } = workspaceAccess.context;

  return {
    ok: true,
    data: {
      workspace: mapUserWorkspaceSummary(pb, workspace, membership),
    },
  };
}

async function requireWorkspaceMembershipContext(
  workspaceSlug: string
): Promise<WorkspaceMembershipContextResult> {
  return resolveWorkspaceMembershipContext(
    await requireWorkspaceContext("read"),
    workspaceSlug,
    "requireWorkspaceMembershipContext"
  );
}

async function requireWorkspaceContext(
  mode: "read" | "action"
): Promise<WorkspaceAuthContextResult> {
  const currentUser =
    mode === "action" ? await requireCurrentWritableUser() : await requireCurrentUser();

  if (!currentUser.ok) {
    const setCookie: string[] | undefined =
      "setCookie" in currentUser && Array.isArray(currentUser.setCookie)
        ? currentUser.setCookie
        : undefined;

    return {
      ok: false,
      response: {
        ok: false,
        errorCode: currentUser.errorCode,
        ...(setCookie ? { setCookie } : {}),
      },
    };
  }

  return {
    ok: true,
    context: {
      pb: currentUser.pb,
      user: currentUser.user,
    },
  };
}

async function resolveWorkspaceMembershipContext(
  currentUser: WorkspaceAuthContextResult,
  workspaceSlug: string,
  logContext: string
): Promise<WorkspaceMembershipContextResult> {
  if (!currentUser.ok) {
    return currentUser;
  }

  try {
    const workspaceMembership = await resolveWorkspaceMembershipContextBySlug(
      currentUser.context.pb,
      currentUser.context.user.id,
      workspaceSlug
    );

    if (workspaceMembership.state === "workspace_not_found") {
      return createWorkspaceAccessFailure("NOT_FOUND");
    }

    if (workspaceMembership.state === "membership_not_found") {
      return createWorkspaceAccessFailure("FORBIDDEN");
    }

    return {
      ok: true,
      context: {
        ...currentUser.context,
        workspace: workspaceMembership.workspace,
        membership: workspaceMembership.membership,
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, function mapAccessError(pocketBaseError) {
      if (pocketBaseError.status === 400) {
        return "BAD_REQUEST";
      }

      if (pocketBaseError.status === 401) {
        return "UNAUTHORIZED";
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
      logWorkspaceServiceError(logContext, error);
    }

    return createWorkspaceAccessFailure(errorCode);
  }
}

async function resolveWorkspaceMembershipContextBySlug(
  pb: PocketBase,
  userId: string,
  workspaceSlug: string
): Promise<WorkspaceMembershipLookup> {
  const workspace = await findWorkspaceBySlug(pb, workspaceSlug);

  if (!workspace) {
    return {
      state: "workspace_not_found",
    };
  }

  const membership = await findWorkspaceMembershipByWorkspaceAndUser(pb, workspace.id, userId);

  if (!membership) {
    return {
      state: "membership_not_found",
    };
  }

  return {
    state: "ready",
    workspace,
    membership,
  };
}

async function findWorkspaceBySlug(
  pb: PocketBase,
  workspaceSlug: string
): Promise<WorkspacesRecord | null> {
  try {
    return await pb
      .collection("workspaces")
      .getFirstListItem<WorkspacesRecord>(pb.filter("slug = {:workspaceSlug}", { workspaceSlug }));
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

async function findWorkspaceMembershipByWorkspaceAndUser(
  pb: PocketBase,
  workspaceId: string,
  userId: string
): Promise<WorkspaceMembersRecord | null> {
  try {
    return await pb.collection("workspace_members").getFirstListItem<WorkspaceMembersRecord>(
      pb.filter("workspace = {:workspaceId} && user = {:userId}", {
        workspaceId,
        userId,
      })
    );
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

function createWorkspaceAccessFailure(
  errorCode: WorkspaceErrorCode
): WorkspaceMembershipContextResult {
  return {
    ok: false,
    response: {
      ok: false,
      errorCode,
    },
  };
}
