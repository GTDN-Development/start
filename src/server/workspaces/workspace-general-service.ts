import type PocketBase from "pocketbase";
import type { WorkspacesRecord } from "@/types/pocketbase";
import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import { getNullableTrimmedString, hasValidationCode } from "@/server/pocketbase/pocketbase-utils";
import { requireWorkspaceAuthContext } from "@/server/workspaces/workspace-auth-context";
import {
  requireOwnerWorkspaceAccessBySlug,
  requireWorkspaceAccess,
} from "@/server/workspaces/workspace-access";
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
import { mapUserWorkspaceSummary, sortUserWorkspaces } from "@/server/workspaces/workspace-mappers";
import {
  createPersonalWorkspaceSlug,
  getPersonalWorkspaceName,
  normalizeWorkspaceName,
  resolveUniqueWorkspaceSlug,
  toWorkspaceSlug,
} from "@/server/workspaces/workspace-normalization";
import {
  ensureWorkspaceMembership,
  findWorkspaceBySlug,
  findWorkspaceMembershipByWorkspaceAndUser,
  listUserWorkspaceMembershipRecords,
} from "@/server/workspaces/workspace-repository";
import type { ServerWorkspaceResponse, UserWorkspace } from "@/server/workspaces/workspace-types";
import { consumePendingInviteIfPresent } from "@/server/workspaces/workspace-invite-service";

export type CreateOrganizationWorkspaceInput = {
  name: string;
  slug?: string | null;
};

export type UpdateWorkspaceGeneralInput = {
  name?: string | null;
  slug?: string | null;
  avatarFile?: File | null;
  removeAvatar?: boolean;
};

export async function ensurePersonalWorkspace(
  userId: string,
  userEmail: string,
  displayName: string | null
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace }>> {
  const { pb } = await createPocketBaseServerClient();

  try {
    const existingPersonalWorkspace = await findExistingPersonalWorkspace(pb, userId);

    if (existingPersonalWorkspace) {
      return {
        ok: true,
        data: {
          workspace: existingPersonalWorkspace,
        },
      };
    }

    const personalWorkspaceName = getPersonalWorkspaceName(displayName, userEmail);
    const personalWorkspaceSlug = createPersonalWorkspaceSlug(userId, personalWorkspaceName);
    const workspace =
      (await findWorkspaceBySlug(pb, personalWorkspaceSlug)) ??
      (await pb.collection("workspaces").create<WorkspacesRecord>({
        name: personalWorkspaceName,
        slug: personalWorkspaceSlug,
        kind: "personal",
      }));
    const membership = await ensureWorkspaceMembership(pb, workspace.id, userId, "owner");

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

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("ensurePersonalWorkspace", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

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

export async function createOrganizationWorkspaceForCurrentUser(
  input: CreateOrganizationWorkspaceInput
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace }>> {
  const currentUser = await requireWorkspaceAuthContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const workspaceName = normalizeWorkspaceName(input.name);

    if (!workspaceName) {
      return {
        ok: false,
        errorCode: "BAD_REQUEST",
      };
    }

    const requestedSlug = getNullableTrimmedString(input.slug) ?? workspaceName;
    const workspaceSlug = await resolveUniqueWorkspaceSlug(currentUser.context.pb, requestedSlug);
    const workspace = await currentUser.context.pb
      .collection("workspaces")
      .create<WorkspacesRecord>({
        name: workspaceName,
        slug: workspaceSlug,
        kind: "organization",
      });
    const membership = await ensureWorkspaceMembership(
      currentUser.context.pb,
      workspace.id,
      currentUser.context.user.id,
      "owner"
    );

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

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("createOrganizationWorkspaceForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
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
          access.context.membership
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

export async function updateWorkspaceGeneralForCurrentUser(
  workspaceSlug: string,
  input: UpdateWorkspaceGeneralInput
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace; previousSlug: string }>> {
  const currentUser = await requireWorkspaceAuthContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const ownerAccess = await requireOwnerWorkspaceAccessBySlug(currentUser.context, workspaceSlug);

    if (!ownerAccess.ok) {
      return ownerAccess.response;
    }

    const updateData: Record<string, string | File | null> = {};

    if (input.name !== undefined) {
      const normalizedName = normalizeWorkspaceName(input.name ?? "");

      if (!normalizedName) {
        return {
          ok: false,
          errorCode: "BAD_REQUEST",
        };
      }

      updateData.name = normalizedName;
    }

    if (input.slug !== undefined) {
      const normalizedSlugInput = getNullableTrimmedString(input.slug);

      if (!normalizedSlugInput) {
        return {
          ok: false,
          errorCode: "BAD_REQUEST",
        };
      }

      const normalizedSlug = toWorkspaceSlug(normalizedSlugInput);
      const existingWorkspace = await findWorkspaceBySlug(ownerAccess.context.pb, normalizedSlug);

      if (existingWorkspace && existingWorkspace.id !== ownerAccess.context.workspace.id) {
        return {
          ok: false,
          errorCode: "SLUG_NOT_AVAILABLE",
        };
      }

      updateData.slug = normalizedSlug;
    }

    if (input.removeAvatar === true) {
      updateData.avatar = null;
    } else if (input.avatarFile) {
      updateData.avatar = input.avatarFile;
    }

    if (Object.keys(updateData).length === 0) {
      return {
        ok: false,
        errorCode: "BAD_REQUEST",
      };
    }

    const updatedWorkspace = await ownerAccess.context.pb
      .collection("workspaces")
      .update<WorkspacesRecord>(ownerAccess.context.workspace.id, updateData);

    return {
      ok: true,
      data: {
        workspace: mapUserWorkspaceSummary(
          ownerAccess.context.pb,
          updatedWorkspace,
          ownerAccess.context.membership
        ),
        previousSlug: ownerAccess.context.workspace.slug,
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, (pocketBaseError) => {
      if (pocketBaseError.status === 400) {
        if (hasValidationCode(pocketBaseError.response?.data, "slug", "validation_not_unique")) {
          return "SLUG_NOT_AVAILABLE";
        }

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
      logWorkspaceServiceError("updateWorkspaceGeneralForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function deleteOrganizationWorkspaceForCurrentUser(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ deleted: true }>> {
  const currentUser = await requireWorkspaceAuthContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const ownerAccess = await requireOwnerWorkspaceAccessBySlug(currentUser.context, workspaceSlug);

    if (!ownerAccess.ok) {
      return ownerAccess.response;
    }

    if (ownerAccess.context.workspace.kind === "personal") {
      return {
        ok: false,
        errorCode: "PERSONAL_WORKSPACE_RESTRICTED",
      };
    }

    await ownerAccess.context.pb.collection("workspaces").delete(ownerAccess.context.workspace.id);

    return {
      ok: true,
      data: {
        deleted: true,
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
      logWorkspaceServiceError("deleteOrganizationWorkspaceForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

async function findExistingPersonalWorkspace(
  pb: PocketBase,
  userId: string
): Promise<UserWorkspace | null> {
  const memberships = await listUserWorkspaceMemberships(pb, userId);

  return memberships.find((workspaceMembership) => workspaceMembership.kind === "personal") ?? null;
}

async function listUserWorkspaceMemberships(
  pb: PocketBase,
  userId: string
): Promise<UserWorkspace[]> {
  const membershipRecords = await listUserWorkspaceMembershipRecords(pb, userId);

  const workspaces = membershipRecords
    .map((membershipRecord) => {
      const expandedWorkspace = membershipRecord.expand?.workspace;

      if (!expandedWorkspace) {
        return null;
      }

      return mapUserWorkspaceSummary(pb, expandedWorkspace, membershipRecord);
    })
    .filter((workspace): workspace is UserWorkspace => workspace !== null);

  return workspaces.sort(sortUserWorkspaces);
}
