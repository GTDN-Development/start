import type PocketBase from "pocketbase";
import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import { requireWorkspaceActionContext } from "@/server/workspaces/workspace-auth-context";
import { getActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";
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
    const errorCode = mapWorkspaceErrorCode(error, (pocketBaseError) => {
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
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("listUserWorkspaces", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function resolveWorkspaceForUserBySlug(
  userId: string,
  slug: string
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace | null }>> {
  const { pb } = await createPocketBaseServerClient();

  return resolveWorkspaceForUserBySlugWithClient(pb, userId, slug);
}

export async function resolveWorkspaceForUserBySlugWithClient(
  pb: PocketBase,
  userId: string,
  slug: string
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace | null }>> {
  try {
    const workspace = await findWorkspaceBySlug(pb, slug);

    if (!workspace) {
      return {
        ok: true,
        data: {
          workspace: null,
        },
      };
    }

    const membership = await findWorkspaceMembershipByWorkspaceAndUser(pb, workspace.id, userId);

    if (!membership) {
      return {
        ok: true,
        data: {
          workspace: null,
        },
      };
    }

    return {
      ok: true,
      data: {
        workspace: mapUserWorkspaceSummary(pb, workspace, membership),
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, (pocketBaseError) => {
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
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("resolveWorkspaceForUserBySlug", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function resolvePostAuthDestination(input: {
  userId: string;
  pendingInviteToken?: string | null;
}): Promise<ServerWorkspaceResponse<PostAuthDestination>> {
  if (input.pendingInviteToken) {
    return {
      ok: true,
      data: {
        state: "invite_redirect",
        inviteToken: input.pendingInviteToken,
      },
    };
  }

  const activeWorkspaceResponse = await resolveActiveWorkspaceForUser(input.userId);

  if (!activeWorkspaceResponse.ok) {
    return activeWorkspaceResponse;
  }

  if (activeWorkspaceResponse.data.workspace) {
    return {
      ok: true,
      data: {
        state: "workspace_redirect",
        workspaceSlug: activeWorkspaceResponse.data.workspace.slug,
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

export async function switchWorkspaceForCurrentUser(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace }>> {
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

    return {
      ok: true,
      data: {
        workspace: mapUserWorkspaceSummary(currentUser.context.pb, workspace, membership),
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
      logWorkspaceServiceError("switchWorkspaceForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function resolveActiveWorkspaceForUser(
  userId: string
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace | null }>> {
  const { pb } = await createPocketBaseServerClient();

  return resolveActiveWorkspaceForUserWithClient(pb, userId);
}

export async function resolveActiveWorkspaceForUserWithClient(
  pb: PocketBase,
  userId: string
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace | null }>> {
  const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();

  if (!activeWorkspaceSlug) {
    return {
      ok: true,
      data: {
        workspace: null,
      },
    };
  }

  const workspaceResponse = await resolveWorkspaceForUserBySlugWithClient(
    pb,
    userId,
    activeWorkspaceSlug
  );

  if (!workspaceResponse.ok) {
    return workspaceResponse;
  }

  return workspaceResponse;
}

async function listUserWorkspaceMemberships(
  pb: PocketBase,
  userId: string
): Promise<UserWorkspace[]> {
  const membershipRecords = await listUserWorkspaceMembershipRecords(pb, userId);

  const workspaces = membershipRecords.map((membershipRecord) => {
    const expandedWorkspace = membershipRecord.expand?.workspace;

    if (!expandedWorkspace) {
      return null;
    }

    return mapUserWorkspaceSummary(pb, expandedWorkspace, membershipRecord);
  });

  return workspaces
    .filter((workspace): workspace is UserWorkspace => workspace !== null)
    .sort(sortUserWorkspaces);
}
