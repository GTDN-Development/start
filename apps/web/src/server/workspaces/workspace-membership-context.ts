import type PocketBase from "pocketbase";
import type { WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";
import {
  requireWorkspaceActionContext,
  requireWorkspaceAuthContext,
  type WorkspaceAuthContext,
} from "@/server/workspaces/workspace-auth-context";
import {
  findWorkspaceBySlug,
  findWorkspaceMembershipByWorkspaceAndUser,
} from "@/server/workspaces/workspace-repository";
import type { ServerWorkspaceResponse } from "@/server/workspaces/workspace-types";

export type WorkspaceMembershipContext = WorkspaceAuthContext & {
  membership: WorkspaceMembersRecord;
  workspace: WorkspacesRecord;
};

type WorkspaceAuthContextResult = Awaited<ReturnType<typeof requireWorkspaceAuthContext>>;

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

export async function requireWorkspaceMembershipContext(
  workspaceSlug: string
): Promise<WorkspaceMembershipContextResult> {
  return resolveWorkspaceMembershipContext(await requireWorkspaceAuthContext(), workspaceSlug);
}

export async function requireWorkspaceActionMembershipContext(
  workspaceSlug: string
): Promise<WorkspaceMembershipContextResult> {
  return resolveWorkspaceMembershipContext(await requireWorkspaceActionContext(), workspaceSlug);
}

export async function resolveWorkspaceMembershipContextBySlug(
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
  workspaceSlug: string
): Promise<WorkspaceMembershipContextResult> {
  if (!currentUser.ok) {
    return currentUser;
  }

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
}
