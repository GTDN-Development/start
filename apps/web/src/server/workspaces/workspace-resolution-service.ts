import type PocketBase from "pocketbase";
import type { UsersRecord, WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";
import { requireCurrentUser, requireCurrentWritableUser } from "@/server/auth/current-user";
import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import {
  getActiveWorkspaceSlugCookie,
  getPendingInviteTokenCookie,
} from "@/server/workspaces/workspace-cookie";
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
import { mapUserWorkspaceSummary, sortUserWorkspaces } from "@/server/workspaces/workspace-mappers";
import {
  findWorkspaceBySlug,
  findWorkspaceMembershipByWorkspaceAndUser,
  listUserWorkspaceMembershipRecords,
} from "@/server/workspaces/workspace-repository";
import type {
  PostAuthDestination,
  ServerWorkspaceResponse,
  UserWorkspace,
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

type WorkspaceMembershipContextLookup =
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

type WorkspaceErrorMapper = Parameters<typeof mapWorkspaceErrorCode>[1];

const WORKSPACE_LIST_ERROR_MAPPER: WorkspaceErrorMapper = function mapWorkspaceListError(
  pocketBaseError
) {
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
};

const WORKSPACE_ACCESS_ERROR_MAPPER: WorkspaceErrorMapper = function mapWorkspaceAccessError(
  pocketBaseError
) {
  if (pocketBaseError.status === 404) {
    return "NOT_FOUND";
  }

  return WORKSPACE_LIST_ERROR_MAPPER(pocketBaseError);
};

export async function listUserWorkspacesWithClient(
  pb: PocketBase,
  userId: string
): Promise<ServerWorkspaceResponse<{ workspaces: UserWorkspace[] }>> {
  try {
    const workspaces = await listUserWorkspaceMemberships(pb, userId);

    return {
      ok: true,
      data: {
        workspaces,
      },
    };
  } catch (error) {
    return createWorkspaceServiceErrorResponse(
      "listUserWorkspaces",
      error,
      WORKSPACE_LIST_ERROR_MAPPER
    );
  }
}

export async function resolvePostAuthDestinationForUser({
  userId,
}: {
  userId: string;
}): Promise<ServerWorkspaceResponse<PostAuthDestination>> {
  const pendingInviteToken = await getPendingInviteTokenCookie();

  if (pendingInviteToken) {
    return {
      ok: true,
      data: {
        state: "invite_redirect",
        inviteToken: pendingInviteToken,
      },
    };
  }

  const activeWorkspaceResponse = await resolveActiveWorkspaceSlugForUser(userId);

  if (!activeWorkspaceResponse.ok) {
    return activeWorkspaceResponse;
  }

  if (activeWorkspaceResponse.data.workspaceSlug) {
    return {
      ok: true,
      data: {
        state: "workspace_redirect",
        workspaceSlug: activeWorkspaceResponse.data.workspaceSlug,
      },
    };
  }

  return {
    ok: true,
    data: {
      state: "app",
    },
  };
}

export async function resolveAccessibleWorkspaceForCurrentUser(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace }>> {
  const workspaceAccess = await requireWorkspaceActionMembershipContext(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { pb, membership, workspace } = workspaceAccess.context;

    return {
      ok: true,
      data: {
        workspace: mapUserWorkspaceSummary(pb, workspace, membership),
      },
    };
  } catch (error) {
    return createWorkspaceServiceErrorResponse(
      "resolveAccessibleWorkspaceForCurrentUser",
      error,
      WORKSPACE_ACCESS_ERROR_MAPPER
    );
  }
}

export async function resolveCurrentUserWorkspaceRouteAccess(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<WorkspaceRouteAccessContext>> {
  const workspaceAccess = await requireWorkspaceMembershipContext(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { pb, user, membership, workspace } = workspaceAccess.context;

    return {
      ok: true,
      data: {
        pb,
        user,
        workspace: mapUserWorkspaceSummary(pb, workspace, membership),
      },
    };
  } catch (error) {
    return createWorkspaceServiceErrorResponse(
      "resolveCurrentUserWorkspaceRouteAccess",
      error,
      WORKSPACE_ACCESS_ERROR_MAPPER
    );
  }
}

export async function resolveActiveWorkspaceSlugForUser(
  userId: string
): Promise<ServerWorkspaceResponse<{ workspaceSlug: string | null }>> {
  const { pb } = await createPocketBaseServerClient();

  return resolveActiveWorkspaceSlugForUserWithClient(pb, userId);
}

async function resolveActiveWorkspaceSlugForUserWithClient(
  pb: PocketBase,
  userId: string
): Promise<ServerWorkspaceResponse<{ workspaceSlug: string | null }>> {
  const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();

  if (!activeWorkspaceSlug) {
    return {
      ok: true,
      data: {
        workspaceSlug: null,
      },
    };
  }

  try {
    const workspaceMembership = await resolveWorkspaceMembershipContextBySlug(
      pb,
      userId,
      activeWorkspaceSlug
    );

    return {
      ok: true,
      data: {
        workspaceSlug:
          workspaceMembership.state === "ready" ? workspaceMembership.workspace.slug : null,
      },
    };
  } catch (error) {
    return createWorkspaceServiceErrorResponse(
      "resolveActiveWorkspaceSlugForUser",
      error,
      WORKSPACE_LIST_ERROR_MAPPER
    );
  }
}

export async function requireWorkspaceActionContext(): Promise<WorkspaceAuthContextResult> {
  return requireWorkspaceContext("action");
}

export async function requireWorkspaceMembershipContext(
  workspaceSlug: string
): Promise<WorkspaceMembershipContextResult> {
  return resolveWorkspaceMembershipContext(
    await requireWorkspaceContext("read"),
    workspaceSlug,
    "requireWorkspaceMembershipContext"
  );
}

export async function requireWorkspaceActionMembershipContext(
  workspaceSlug: string
): Promise<WorkspaceMembershipContextResult> {
  return resolveWorkspaceMembershipContext(
    await requireWorkspaceActionContext(),
    workspaceSlug,
    "requireWorkspaceActionMembershipContext"
  );
}

async function resolveWorkspaceMembershipContextBySlug(
  pb: PocketBase,
  userId: string,
  workspaceSlug: string
): Promise<WorkspaceMembershipContextLookup> {
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
      return {
        ok: false,
        response: {
          ok: false,
          errorCode: "NOT_FOUND",
        },
      };
    }

    if (workspaceMembership.state === "membership_not_found") {
      return {
        ok: false,
        response: {
          ok: false,
          errorCode: "FORBIDDEN",
        },
      };
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
    return {
      ok: false,
      response: createWorkspaceServiceErrorResponse(
        logContext,
        error,
        WORKSPACE_ACCESS_ERROR_MAPPER
      ),
    };
  }
}

async function requireWorkspaceContext(
  mode: "read" | "action"
): Promise<WorkspaceAuthContextResult> {
  const currentUser =
    mode === "action" ? await requireCurrentWritableUser() : await requireCurrentUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      response: createWorkspaceAuthFailureResponse(currentUser),
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

function createWorkspaceAuthFailureResponse(input: {
  errorCode: "UNAUTHORIZED" | "UNKNOWN_ERROR";
  setCookie?: string[];
}): ServerWorkspaceResponse<never> {
  return {
    ok: false,
    errorCode: input.errorCode,
    ...(input.setCookie ? { setCookie: input.setCookie } : {}),
  };
}

function createWorkspaceServiceErrorResponse<TData>(
  context: string,
  error: unknown,
  operationMapper: WorkspaceErrorMapper
): ServerWorkspaceResponse<TData> {
  const errorCode = mapWorkspaceErrorCode(error, operationMapper);

  if (errorCode === "UNKNOWN_ERROR") {
    logWorkspaceServiceError(context, error);
  }

  return {
    ok: false,
    errorCode,
  };
}

async function listUserWorkspaceMemberships(
  pb: PocketBase,
  userId: string
): Promise<UserWorkspace[]> {
  const membershipRecords = await listUserWorkspaceMembershipRecords(pb, userId);

  const workspaces = await Promise.all(
    membershipRecords.map(async function mapMembershipRecord(membershipRecord) {
      const expandedWorkspace = membershipRecord.expand?.workspace;

      if (!expandedWorkspace) {
        return null;
      }

      return mapUserWorkspaceSummary(pb, expandedWorkspace, membershipRecord);
    })
  );

  return workspaces
    .filter((workspace): workspace is UserWorkspace => workspace !== null)
    .sort(sortUserWorkspaces);
}
