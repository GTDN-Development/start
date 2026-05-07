import PocketBase, { ClientResponseError } from "pocketbase";
import type { UsersRecord, WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";
import type { AuthCookieMutations } from "@/server/auth/auth-cookies";
import { requireCurrentUser, requireCurrentWritableUser } from "@/server/auth/auth-session-service";
import { createWorkspaceErrorResponse } from "@/server/workspaces/workspace-errors";
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

type WorkspaceMembershipContextResult =
  | {
      ok: true;
      context: WorkspaceMembershipContext;
    }
  | {
      ok: false;
      response: ServerWorkspaceResponse<never>;
    };

export async function resolveWorkspaceRouteAccess(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<WorkspaceRouteAccessContext>> {
  const workspaceAccess = await resolveWorkspaceMembership(
    workspaceSlug,
    "read",
    "resolveWorkspaceRouteAccess"
  );

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
  return resolveWorkspaceMembership(workspaceSlug, "action", "resolveWorkspaceActionAccess");
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

async function resolveWorkspaceMembership(
  workspaceSlug: string,
  mode: "read" | "action",
  logContext: string
): Promise<WorkspaceMembershipContextResult> {
  const currentUser =
    mode === "action" ? await requireCurrentWritableUser() : await requireCurrentUser();

  if (!currentUser.ok) {
    const cookieMutations =
      "cookieMutations" in currentUser
        ? (currentUser.cookieMutations as AuthCookieMutations)
        : undefined;

    return {
      ok: false,
      response: {
        ok: false,
        errorCode: currentUser.errorCode,
        ...(cookieMutations ? { cookieMutations } : {}),
      },
    };
  }

  try {
    const workspace = await findWorkspaceBySlug(currentUser.pb, workspaceSlug);

    if (!workspace) {
      return createWorkspaceAccessFailure("NOT_FOUND");
    }

    const membership = await findWorkspaceMembership(
      currentUser.pb,
      workspace.id,
      currentUser.user.id
    );

    if (!membership) {
      return createWorkspaceAccessFailure("FORBIDDEN");
    }

    return {
      ok: true,
      context: {
        pb: currentUser.pb,
        user: currentUser.user,
        workspace,
        membership,
      },
    };
  } catch (error) {
    return {
      ok: false,
      response: createWorkspaceErrorResponse(logContext, error, {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
      }),
    };
  }
}

async function findWorkspaceBySlug(pb: PocketBase, workspaceSlug: string) {
  return findFirstListItemOrNull<WorkspacesRecord>(
    pb,
    "workspaces",
    pb.filter("slug = {:workspaceSlug}", { workspaceSlug })
  );
}

async function findWorkspaceMembership(pb: PocketBase, workspaceId: string, userId: string) {
  return findFirstListItemOrNull<WorkspaceMembersRecord>(
    pb,
    "workspace_members",
    pb.filter("workspace = {:workspaceId} && user = {:userId}", {
      workspaceId,
      userId,
    })
  );
}

async function findFirstListItemOrNull<TRecord>(
  pb: PocketBase,
  collectionName: string,
  filter: string
): Promise<TRecord | null> {
  try {
    return await pb.collection(collectionName).getFirstListItem<TRecord>(filter);
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
