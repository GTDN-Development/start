import type { WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";
import type { WorkspaceAuthContext } from "@/server/workspaces/workspace-auth-context";
import {
  findWorkspaceBySlug,
  findWorkspaceMembershipByWorkspaceAndUser,
} from "@/server/workspaces/workspace-repository";
import type { ServerWorkspaceResponse } from "@/server/workspaces/workspace-types";

export type WorkspaceAccessContext = WorkspaceAuthContext & {
  workspace: WorkspacesRecord;
  membership: WorkspaceMembersRecord;
};

type WorkspaceAccessResult =
  | {
      ok: true;
      context: WorkspaceAccessContext;
    }
  | {
      ok: false;
      response: ServerWorkspaceResponse<never>;
    };

type OwnerWorkspaceAccessResult =
  | {
      ok: true;
      context: WorkspaceAccessContext;
    }
  | {
      ok: false;
      response: ServerWorkspaceResponse<never>;
    };

type AdminWorkspaceAccessResult =
  | {
      ok: true;
      context: WorkspaceAccessContext;
    }
  | {
      ok: false;
      response: ServerWorkspaceResponse<never>;
    };

export async function requireWorkspaceAccess(
  authContext: WorkspaceAuthContext,
  workspaceSlug: string
): Promise<WorkspaceAccessResult> {
  const workspace = await findWorkspaceBySlug(authContext.pb, workspaceSlug);

  if (!workspace) {
    return {
      ok: false,
      response: {
        ok: false,
        errorCode: "NOT_FOUND",
      },
    };
  }

  const membership = await findWorkspaceMembershipByWorkspaceAndUser(
    authContext.pb,
    workspace.id,
    authContext.user.id
  );

  if (!membership) {
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
      ...authContext,
      workspace,
      membership,
    },
  };
}

export function requireOwnerWorkspaceAccess(
  accessContext: WorkspaceAccessContext
): OwnerWorkspaceAccessResult {
  if (accessContext.membership.role !== "owner") {
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
    context: accessContext,
  };
}

export function requireAdminWorkspaceAccess(
  accessContext: WorkspaceAccessContext
): AdminWorkspaceAccessResult {
  if (accessContext.membership.role === "member") {
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
    context: accessContext,
  };
}

export async function requireOwnerWorkspaceAccessBySlug(
  authContext: WorkspaceAuthContext,
  workspaceSlug: string
): Promise<OwnerWorkspaceAccessResult> {
  const access = await requireWorkspaceAccess(authContext, workspaceSlug);

  if (!access.ok) {
    return access;
  }

  return requireOwnerWorkspaceAccess(access.context);
}

export async function requireAdminWorkspaceAccessBySlug(
  authContext: WorkspaceAuthContext,
  workspaceSlug: string
): Promise<AdminWorkspaceAccessResult> {
  const access = await requireWorkspaceAccess(authContext, workspaceSlug);

  if (!access.ok) {
    return access;
  }

  return requireAdminWorkspaceAccess(access.context);
}
