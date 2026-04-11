import type PocketBase from "pocketbase";
import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import { getActiveWorkspaceSlugCookie } from "@/server/workspaces/workspace-cookie";
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
import { mapUserWorkspaceSummary, sortUserWorkspaces } from "@/server/workspaces/workspace-mappers";
import {
  requireWorkspaceActionMembershipContext,
  resolveWorkspaceMembershipContextBySlug,
} from "@/server/workspaces/workspace-membership-context";
import { listUserWorkspaceMembershipRecords } from "@/server/workspaces/workspace-repository";
import type {
  PostAuthDestination,
  ServerWorkspaceResponse,
  UserWorkspace,
} from "@/server/workspaces/workspace-types";

export async function listUserWorkspaces(
  userId: string
): Promise<ServerWorkspaceResponse<{ workspaces: UserWorkspace[] }>> {
  const { pb } = await createPocketBaseServerClient();

  return listUserWorkspacesWithClient(pb, userId);
}

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
    const workspaceMembership = await resolveWorkspaceMembershipContextBySlug(pb, userId, slug);

    if (workspaceMembership.state !== "ready") {
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
        workspace: mapUserWorkspaceSummary(
          pb,
          workspaceMembership.workspace,
          workspaceMembership.membership
        ),
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
  userEmail: string;
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

  const activeWorkspaceResponse = await resolveActiveWorkspaceSlugForUser(input.userId);

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

export async function switchWorkspaceForCurrentUser(
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

export async function resolveActiveWorkspaceSlugForUser(
  userId: string
): Promise<ServerWorkspaceResponse<{ workspaceSlug: string | null }>> {
  const { pb } = await createPocketBaseServerClient();

  return resolveActiveWorkspaceSlugForUserWithClient(pb, userId);
}

export async function resolveActiveWorkspaceSlugForUserWithClient(
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
      logWorkspaceServiceError("resolveActiveWorkspaceSlugForUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

async function listUserWorkspaceMemberships(
  pb: PocketBase,
  userId: string
): Promise<UserWorkspace[]> {
  const membershipRecords = await listUserWorkspaceMembershipRecords(pb, userId);

  const workspaces = await Promise.all(
    membershipRecords.map(async (membershipRecord) => {
      const expandedWorkspace = membershipRecord.expand?.workspace;

      if (!expandedWorkspace) {
        return null;
      }

      return mapUserWorkspaceSummary(
        pb,
        expandedWorkspace,
        membershipRecord
      );
    })
  );

  return workspaces
    .filter((workspace): workspace is UserWorkspace => workspace !== null)
    .sort(sortUserWorkspaces);
}
