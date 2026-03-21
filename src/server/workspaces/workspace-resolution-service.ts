import type PocketBase from "pocketbase";
import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import { requireWorkspaceAuthContext } from "@/server/workspaces/workspace-auth-context";
import { requireWorkspaceAccess } from "@/server/workspaces/workspace-access";
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
import { mapUserWorkspaceSummary, sortUserWorkspaces } from "@/server/workspaces/workspace-mappers";
import { ensurePersonalWorkspace } from "@/server/workspaces/workspace-general-service";
import { consumePendingInviteIfPresent } from "@/server/workspaces/workspace-invite-service";
import {
  countWorkspaceMembers,
  findWorkspaceBySlug,
  findWorkspaceMembershipByWorkspaceAndUser,
  listUserWorkspaceMembershipRecords,
} from "@/server/workspaces/workspace-repository";
import type { ServerWorkspaceResponse, UserWorkspace } from "@/server/workspaces/workspace-types";

export async function listUserWorkspaces(
  userId: string
): Promise<ServerWorkspaceResponse<{ workspaces: UserWorkspace[] }>> {
  const { pb } = await createPocketBaseServerClient();

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
        workspace: mapUserWorkspaceSummary(
          pb,
          workspace,
          membership,
          await countWorkspaceMembers(pb, workspace.id)
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

export async function pickWorkspaceForOverview(
  userId: string,
  activeWorkspaceSlugCookie: string | null
): Promise<
  ServerWorkspaceResponse<{ workspace: UserWorkspace | null; workspaces: UserWorkspace[] }>
> {
  const workspaceListResponse = await listUserWorkspaces(userId);

  if (!workspaceListResponse.ok) {
    return workspaceListResponse;
  }

  const workspaces = workspaceListResponse.data.workspaces;

  if (workspaces.length === 0) {
    return {
      ok: true,
      data: {
        workspace: null,
        workspaces,
      },
    };
  }

  const preferredWorkspace =
    (activeWorkspaceSlugCookie
      ? workspaces.find((workspace) => workspace.slug === activeWorkspaceSlugCookie)
      : null) ?? workspaces[0];

  return {
    ok: true,
    data: {
      workspace: preferredWorkspace,
      workspaces,
    },
  };
}

export async function resolvePostAuthWorkspace(input: {
  userId: string;
  userEmail: string;
  userName: string | null;
  activeWorkspaceSlugCookie: string | null;
}): Promise<ServerWorkspaceResponse<{ workspaceSlug: string }>> {
  const personalWorkspaceResponse = await ensurePersonalWorkspace(
    input.userId,
    input.userEmail,
    input.userName
  );

  if (!personalWorkspaceResponse.ok) {
    return {
      ok: false,
      errorCode: personalWorkspaceResponse.errorCode,
      ...(personalWorkspaceResponse.setCookie
        ? { setCookie: personalWorkspaceResponse.setCookie }
        : {}),
    };
  }

  const pendingInviteResponse = await consumePendingInviteIfPresent({
    id: input.userId,
    email: input.userEmail,
  });

  if (!pendingInviteResponse.ok) {
    console.warn(
      `[workspace-service] resolvePostAuthWorkspace: pending invite consume failed (${pendingInviteResponse.errorCode})`
    );
  }

  const pickWorkspaceResponse = await pickWorkspaceForOverview(
    input.userId,
    input.activeWorkspaceSlugCookie
  );

  if (!pickWorkspaceResponse.ok || !pickWorkspaceResponse.data.workspace) {
    return {
      ok: false,
      errorCode: "UNAUTHORIZED",
      ...(pickWorkspaceResponse.ok
        ? {}
        : pickWorkspaceResponse.setCookie
          ? { setCookie: pickWorkspaceResponse.setCookie }
          : {}),
    };
  }

  let targetWorkspaceSlug = pickWorkspaceResponse.data.workspace.slug;

  if (
    pendingInviteResponse.ok &&
    (pendingInviteResponse.data.result.state === "accepted" ||
      pendingInviteResponse.data.result.state === "already_member")
  ) {
    targetWorkspaceSlug = pendingInviteResponse.data.result.workspace.slug;
  }

  return {
    ok: true,
    data: {
      workspaceSlug: targetWorkspaceSlug,
    },
    ...(pendingInviteResponse.ok
      ? {}
      : pendingInviteResponse.setCookie
        ? { setCookie: pendingInviteResponse.setCookie }
        : {}),
  };
}

export async function switchWorkspaceForCurrentUser(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace }>> {
  const currentUser = await requireWorkspaceAuthContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const access = await requireWorkspaceAccess(currentUser.context, workspaceSlug);

    if (!access.ok) {
      return access.response;
    }

    return {
      ok: true,
      data: {
        workspace: mapUserWorkspaceSummary(
          access.context.pb,
          access.context.workspace,
          access.context.membership,
          await countWorkspaceMembers(access.context.pb, access.context.workspace.id)
        ),
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
        membershipRecord,
        await countWorkspaceMembers(pb, expandedWorkspace.id)
      );
    })
  );

  return workspaces
    .filter((workspace): workspace is UserWorkspace => workspace !== null)
    .sort(sortUserWorkspaces);
}
