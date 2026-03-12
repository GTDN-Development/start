import { randomBytes, createHash } from "node:crypto";
import PocketBase, { ClientResponseError } from "pocketbase";
import type {
  UsersRecord,
  WorkspaceInvitesRecord,
  WorkspaceMembersRecord,
  WorkspacesRecord,
} from "@/types/pocketbase";
import { site } from "@/config/site";
import { escapeHtml, sendEmail } from "@/server/email/send-form-email";
import {
  createClearedPocketBaseAuthCookies,
  createPocketBaseServerClient,
} from "@/server/pocketbase/pocketbase-server";
import {
  getAvatarUrl,
  getNullableTrimmedString,
  hasValidationCode,
  isUsersRecord,
  logServiceError,
} from "@/server/pocketbase/pocketbase-utils";
import {
  clearPendingInviteHashCookie,
  getPendingInviteHashCookie,
} from "@/server/workspaces/workspace-cookie";
import type {
  PendingInviteConsumeResult,
  ServerWorkspaceResponse,
  UserWorkspace,
  WorkspaceErrorCode,
  WorkspaceInviteAcceptResult,
  WorkspaceInviteRole,
  WorkspaceInviteSummary,
  WorkspaceMemberRole,
  WorkspaceMemberSummary,
  WorkspaceSummary,
} from "@/server/workspaces/workspace-types";

const MAX_WORKSPACE_NAME_LENGTH = 32;
const MAX_WORKSPACE_SLUG_LENGTH = 48;
const INVITE_TTL_DAYS = 7;
const INVITE_RESEND_COOLDOWN_SECONDS = 60;
const INVITE_TOKEN_BYTES = 32;

type WorkspaceMemberRecordWithExpand = WorkspaceMembersRecord & {
  expand?: {
    workspace?: WorkspacesRecord;
    user?: UsersRecord;
  };
};

type WorkspaceInviteRecordWithExpand = WorkspaceInvitesRecord & {
  expand?: {
    invited_by?: UsersRecord;
  };
};

type CurrentUser =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
    }
  | {
      ok: false;
      response: ServerWorkspaceResponse<never>;
    };

type WorkspaceAccessResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
      workspace: WorkspacesRecord;
      membership: WorkspaceMembersRecord;
    }
  | {
      ok: false;
      response: ServerWorkspaceResponse<never>;
    };

type OwnerWorkspaceAccessResult =
  | {
      ok: true;
      pb: PocketBase;
      user: UsersRecord;
      workspace: WorkspacesRecord;
      membership: WorkspaceMembersRecord;
    }
  | {
      ok: false;
      response: ServerWorkspaceResponse<never>;
    };

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

export type CreateWorkspaceInviteInput = {
  email: string;
  role: WorkspaceInviteRole;
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
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace | null; workspaces: UserWorkspace[] }>> {
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

export async function listWorkspaceMembers(
  workspaceId: string
): Promise<ServerWorkspaceResponse<{ members: WorkspaceMemberSummary[] }>> {
  const { pb } = await createPocketBaseServerClient();

  try {
    const memberRecords = await pb.collection("workspace_members").getFullList<WorkspaceMemberRecordWithExpand>({
      filter: pb.filter("workspace = {:workspaceId}", { workspaceId }),
      expand: "user",
      sort: "-created",
    });

    const members = memberRecords
      .map((memberRecord) => {
        const expandedUser = memberRecord.expand?.user;

        if (!expandedUser) {
          return null;
        }

        return {
          id: memberRecord.id,
          userId: expandedUser.id,
          email: expandedUser.email,
          name: getNullableTrimmedString(expandedUser.name),
          avatarUrl: getAvatarUrl(pb, expandedUser),
          role: memberRecord.role,
        } satisfies WorkspaceMemberSummary;
      })
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

export async function listWorkspaceInvites(
  workspaceId: string
): Promise<ServerWorkspaceResponse<{ invites: WorkspaceInviteSummary[] }>> {
  const { pb } = await createPocketBaseServerClient();

  try {
    const inviteRecords = await pb.collection("workspace_invites").getFullList<WorkspaceInviteRecordWithExpand>({
      filter: pb.filter("workspace = {:workspaceId}", { workspaceId }),
      expand: "invited_by",
      sort: "-created",
    });
    const now = Date.now();

    const invites = inviteRecords
      .filter((inviteRecord) => !isDateStringExpired(inviteRecord.expires_at, now))
      .map((inviteRecord) => ({
        id: inviteRecord.id,
        emailNormalized: inviteRecord.email_normalized,
        role: inviteRecord.role,
        expiresAt: inviteRecord.expires_at,
        updatedAt: inviteRecord.updated,
        invitedByName: getNullableTrimmedString(inviteRecord.expand?.invited_by?.name),
      }));

    return {
      ok: true,
      data: {
        invites,
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
      logWorkspaceServiceError("listWorkspaceInvites", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function consumePendingInviteIfPresent(user: {
  id: string;
  email: string;
}): Promise<ServerWorkspaceResponse<{ result: PendingInviteConsumeResult }>> {
  const inviteHash = await getPendingInviteHashCookie();

  if (!inviteHash) {
    return {
      ok: true,
      data: {
        result: {
          state: "none",
        },
      },
    };
  }

  const { pb } = await createPocketBaseServerClient();

  try {
    const result = await acceptInviteByHash(pb, inviteHash, user);
    await clearPendingInviteHashCookie();

    return {
      ok: true,
      data: {
        result,
      },
    };
  } catch (error) {
    await clearPendingInviteHashCookie();

    const errorCode = mapWorkspaceErrorCode(error, (pocketBaseError) => {
      if (pocketBaseError.status === 404) {
        return "INVITE_INVALID_OR_EXPIRED";
      }

      if (pocketBaseError.status === 403) {
        return "FORBIDDEN";
      }

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("consumePendingInviteIfPresent", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function validateInviteToken(
  inviteToken: string
): Promise<ServerWorkspaceResponse<{ isValid: boolean }>> {
  const { pb } = await createPocketBaseServerClient();

  try {
    const inviteHash = hashInviteToken(inviteToken);
    const inviteRecord = await findInviteByHash(pb, inviteHash);

    if (!inviteRecord) {
      return {
        ok: true,
        data: {
          isValid: false,
        },
      };
    }

    if (isDateStringExpired(inviteRecord.expires_at)) {
      await safeDeleteInvite(pb, inviteRecord.id);
      return {
        ok: true,
        data: {
          isValid: false,
        },
      };
    }

    return {
      ok: true,
      data: {
        isValid: true,
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, (pocketBaseError) => {
      if (pocketBaseError.status === 404) {
        return "INVITE_INVALID_OR_EXPIRED";
      }

      if (pocketBaseError.status === 403) {
        return "FORBIDDEN";
      }

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("validateInviteToken", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function acceptInviteTokenForUser(
  inviteToken: string,
  user: {
    id: string;
    email: string;
  }
): Promise<ServerWorkspaceResponse<{ result: WorkspaceInviteAcceptResult }>> {
  const { pb } = await createPocketBaseServerClient();

  try {
    const inviteHash = hashInviteToken(inviteToken);
    const result = await acceptInviteByHash(pb, inviteHash, user);

    return {
      ok: true,
      data: {
        result,
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, (pocketBaseError) => {
      if (pocketBaseError.status === 404) {
        return "INVITE_INVALID_OR_EXPIRED";
      }

      if (pocketBaseError.status === 403) {
        return "FORBIDDEN";
      }

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("acceptInviteTokenForUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function createOrganizationWorkspaceForCurrentUser(
  input: CreateOrganizationWorkspaceInput
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace }>> {
  const currentUser = await requireCurrentUser();

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
    const workspaceSlug = await resolveUniqueWorkspaceSlug(currentUser.pb, requestedSlug);
    const workspace = await currentUser.pb.collection("workspaces").create<WorkspacesRecord>({
      name: workspaceName,
      slug: workspaceSlug,
      kind: "organization",
    });
    const membership = await ensureWorkspaceMembership(
      currentUser.pb,
      workspace.id,
      currentUser.user.id,
      "owner"
    );

    return {
      ok: true,
      data: {
        workspace: mapUserWorkspaceSummary(currentUser.pb, workspace, membership),
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
  const access = await requireWorkspaceAccess(workspaceSlug);

  if (!access.ok) {
    return access.response;
  }

  return {
    ok: true,
    data: {
      workspace: mapUserWorkspaceSummary(access.pb, access.workspace, access.membership),
    },
  };
}

export async function updateWorkspaceGeneralForCurrentUser(
  workspaceSlug: string,
  input: UpdateWorkspaceGeneralInput
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace; previousSlug: string }>> {
  const access = await requireOwnerWorkspaceAccess(workspaceSlug);

  if (!access.ok) {
    return access.response;
  }

  try {
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
      const existingWorkspace = await findWorkspaceBySlug(access.pb, normalizedSlug);

      if (existingWorkspace && existingWorkspace.id !== access.workspace.id) {
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

    const updatedWorkspace = await access.pb
      .collection("workspaces")
      .update<WorkspacesRecord>(access.workspace.id, updateData);

    return {
      ok: true,
      data: {
        workspace: mapUserWorkspaceSummary(access.pb, updatedWorkspace, access.membership),
        previousSlug: access.workspace.slug,
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

export async function leaveWorkspaceForCurrentUser(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ left: true }>> {
  const access = await requireWorkspaceAccess(workspaceSlug);

  if (!access.ok) {
    return access.response;
  }

  if (access.workspace.kind === "personal") {
    return {
      ok: false,
      errorCode: "PERSONAL_WORKSPACE_RESTRICTED",
    };
  }

  if (access.membership.role === "owner") {
    const ownerCount = await countWorkspaceOwners(access.pb, access.workspace.id);

    if (ownerCount <= 1) {
      return {
        ok: false,
        errorCode: "LAST_OWNER_GUARD",
      };
    }
  }

  try {
    await access.pb.collection("workspace_members").delete(access.membership.id);

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

export async function deleteOrganizationWorkspaceForCurrentUser(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ deleted: true }>> {
  const access = await requireOwnerWorkspaceAccess(workspaceSlug);

  if (!access.ok) {
    return access.response;
  }

  if (access.workspace.kind === "personal") {
    return {
      ok: false,
      errorCode: "PERSONAL_WORKSPACE_RESTRICTED",
    };
  }

  try {
    await access.pb.collection("workspaces").delete(access.workspace.id);

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

export async function changeWorkspaceMemberRoleForCurrentUser(
  workspaceSlug: string,
  memberId: string,
  role: WorkspaceMemberRole
): Promise<ServerWorkspaceResponse<{ updated: true }>> {
  const access = await requireOwnerWorkspaceAccess(workspaceSlug);

  if (!access.ok) {
    return access.response;
  }

  try {
    const memberRecord = await findWorkspaceMemberById(access.pb, access.workspace.id, memberId);

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
      const ownerCount = await countWorkspaceOwners(access.pb, access.workspace.id);

      if (ownerCount <= 1) {
        return {
          ok: false,
          errorCode: "LAST_OWNER_GUARD",
        };
      }
    }

    await access.pb.collection("workspace_members").update(memberRecord.id, {
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
        return "NOT_FOUND";
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
  const access = await requireOwnerWorkspaceAccess(workspaceSlug);

  if (!access.ok) {
    return access.response;
  }

  try {
    const memberRecord = await findWorkspaceMemberById(access.pb, access.workspace.id, memberId);

    if (!memberRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (memberRecord.role === "owner") {
      const ownerCount = await countWorkspaceOwners(access.pb, access.workspace.id);

      if (ownerCount <= 1) {
        return {
          ok: false,
          errorCode: "LAST_OWNER_GUARD",
        };
      }
    }

    await access.pb.collection("workspace_members").delete(memberRecord.id);

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
        return "NOT_FOUND";
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

export async function transferWorkspaceOwnershipForCurrentUser(
  workspaceSlug: string,
  targetMemberId: string
): Promise<ServerWorkspaceResponse<{ transferred: true }>> {
  const access = await requireOwnerWorkspaceAccess(workspaceSlug);

  if (!access.ok) {
    return access.response;
  }

  try {
    const targetMemberRecord = await findWorkspaceMemberById(
      access.pb,
      access.workspace.id,
      targetMemberId
    );

    if (!targetMemberRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (targetMemberRecord.id === access.membership.id || targetMemberRecord.role === "owner") {
      return {
        ok: true,
        data: {
          transferred: true,
        },
      };
    }

    const batch = access.pb.createBatch();
    batch.collection("workspace_members").update(access.membership.id, {
      role: "member",
    });
    batch.collection("workspace_members").update(targetMemberRecord.id, {
      role: "owner",
    });
    await batch.send();

    return {
      ok: true,
      data: {
        transferred: true,
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
      logWorkspaceServiceError("transferWorkspaceOwnershipForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function createWorkspaceInviteForCurrentUser(
  workspaceSlug: string,
  input: CreateWorkspaceInviteInput
): Promise<ServerWorkspaceResponse<{ created: true }>> {
  const access = await requireOwnerWorkspaceAccess(workspaceSlug);

  if (!access.ok) {
    return access.response;
  }

  if (access.workspace.kind === "personal") {
    return {
      ok: false,
      errorCode: "PERSONAL_WORKSPACE_RESTRICTED",
    };
  }

  const normalizedEmail = normalizeEmail(input.email);

  if (!normalizedEmail) {
    return {
      ok: false,
      errorCode: "BAD_REQUEST",
    };
  }

  try {
    const workspaceMembers = await listWorkspaceMembers(access.workspace.id);

    if (!workspaceMembers.ok) {
      return workspaceMembers;
    }

    if (
      workspaceMembers.data.members.some(
        (memberSummary) => normalizeEmail(memberSummary.email) === normalizedEmail
      )
    ) {
      return {
        ok: false,
        errorCode: "BAD_REQUEST",
      };
    }

    const existingInviteRecord = await findInviteByWorkspaceAndEmail(
      access.pb,
      access.workspace.id,
      normalizedEmail
    );

    if (existingInviteRecord && !isDateStringExpired(existingInviteRecord.expires_at)) {
      return {
        ok: false,
        errorCode: "BAD_REQUEST",
      };
    }

    if (existingInviteRecord && isDateStringExpired(existingInviteRecord.expires_at)) {
      await safeDeleteInvite(access.pb, existingInviteRecord.id);
    }

    const inviteToken = createInviteToken();
    const inviteHash = hashInviteToken(inviteToken);
    await access.pb.collection("workspace_invites").create<WorkspaceInvitesRecord>({
      workspace: access.workspace.id,
      email_normalized: normalizedEmail,
      role: input.role,
      token_hash: inviteHash,
      expires_at: createInviteExpiryDate(),
      invited_by: access.user.id,
    });

    try {
      await sendWorkspaceInviteEmail({
        email: normalizedEmail,
        workspaceName: access.workspace.name,
        inviterName: getNullableTrimmedString(access.user.name),
        inviteToken,
      });
    } catch (emailError) {
      logWorkspaceServiceError("createWorkspaceInviteForCurrentUser.sendWorkspaceInviteEmail", emailError);
    }

    return {
      ok: true,
      data: {
        created: true,
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, (pocketBaseError) => {
      if (pocketBaseError.status === 400) {
        if (
          hasValidationCode(
            pocketBaseError.response?.data,
            "email_normalized",
            "validation_not_unique"
          )
        ) {
          return "BAD_REQUEST";
        }

        return "BAD_REQUEST";
      }

      if (pocketBaseError.status === 403) {
        return "FORBIDDEN";
      }

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("createWorkspaceInviteForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function resendWorkspaceInviteForCurrentUser(
  workspaceSlug: string,
  inviteId: string
): Promise<ServerWorkspaceResponse<{ resent: true }>> {
  const access = await requireOwnerWorkspaceAccess(workspaceSlug);

  if (!access.ok) {
    return access.response;
  }

  if (access.workspace.kind === "personal") {
    return {
      ok: false,
      errorCode: "PERSONAL_WORKSPACE_RESTRICTED",
    };
  }

  try {
    const inviteRecord = await findInviteById(access.pb, access.workspace.id, inviteId);

    if (!inviteRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (isDateStringExpired(inviteRecord.expires_at)) {
      await safeDeleteInvite(access.pb, inviteRecord.id);
      return {
        ok: false,
        errorCode: "INVITE_INVALID_OR_EXPIRED",
      };
    }

    const inviteLastUpdatedAt = Date.parse(inviteRecord.updated);

    if (
      Number.isFinite(inviteLastUpdatedAt) &&
      Date.now() - inviteLastUpdatedAt < INVITE_RESEND_COOLDOWN_SECONDS * 1000
    ) {
      return {
        ok: false,
        errorCode: "RATE_LIMITED",
      };
    }

    const nextInviteToken = createInviteToken();
    const nextInviteHash = hashInviteToken(nextInviteToken);

    await access.pb.collection("workspace_invites").update(inviteRecord.id, {
      token_hash: nextInviteHash,
      expires_at: createInviteExpiryDate(),
    });

    try {
      await sendWorkspaceInviteEmail({
        email: inviteRecord.email_normalized,
        workspaceName: access.workspace.name,
        inviterName: getNullableTrimmedString(access.user.name),
        inviteToken: nextInviteToken,
      });
    } catch (emailError) {
      logWorkspaceServiceError("resendWorkspaceInviteForCurrentUser.sendWorkspaceInviteEmail", emailError);
    }

    return {
      ok: true,
      data: {
        resent: true,
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
      logWorkspaceServiceError("resendWorkspaceInviteForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function revokeWorkspaceInviteForCurrentUser(
  workspaceSlug: string,
  inviteId: string
): Promise<ServerWorkspaceResponse<{ revoked: true }>> {
  const access = await requireOwnerWorkspaceAccess(workspaceSlug);

  if (!access.ok) {
    return access.response;
  }

  if (access.workspace.kind === "personal") {
    return {
      ok: false,
      errorCode: "PERSONAL_WORKSPACE_RESTRICTED",
    };
  }

  try {
    const inviteRecord = await findInviteById(access.pb, access.workspace.id, inviteId);

    if (!inviteRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    await access.pb.collection("workspace_invites").delete(inviteRecord.id);

    return {
      ok: true,
      data: {
        revoked: true,
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
      logWorkspaceServiceError("revokeWorkspaceInviteForCurrentUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export function hashInviteToken(inviteToken: string): string {
  return createHash("sha256").update(inviteToken).digest("hex");
}

function createInviteToken(): string {
  return randomBytes(INVITE_TOKEN_BYTES).toString("hex");
}

function createInviteExpiryDate(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_TTL_DAYS);
  return expiresAt.toISOString();
}

function isDateStringExpired(value: string, now = Date.now()): boolean {
  const timestamp = Date.parse(value);

  if (!Number.isFinite(timestamp)) {
    return true;
  }

  return timestamp <= now;
}

function mapWorkspaceSummary(pb: PocketBase, workspace: WorkspacesRecord): WorkspaceSummary {
  return {
    id: workspace.id,
    name: workspace.name,
    slug: workspace.slug,
    kind: workspace.kind,
    avatarUrl: getWorkspaceAvatarUrl(pb, workspace),
  };
}

function mapUserWorkspaceSummary(
  pb: PocketBase,
  workspace: WorkspacesRecord,
  membership: WorkspaceMembersRecord
): UserWorkspace {
  return {
    ...mapWorkspaceSummary(pb, workspace),
    membershipId: membership.id,
    role: membership.role,
  };
}

function getWorkspaceAvatarUrl(pb: PocketBase, workspace: WorkspacesRecord): string | null {
  const avatarName = getNullableTrimmedString(workspace.avatar);

  if (!avatarName) {
    return null;
  }

  return pb.files.getURL(workspace, avatarName);
}

function normalizeWorkspaceName(value: string): string | null {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    return null;
  }

  if (normalizedValue.length > MAX_WORKSPACE_NAME_LENGTH) {
    return null;
  }

  return normalizedValue;
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function getPersonalWorkspaceName(displayName: string | null, userEmail: string): string {
  const normalizedDisplayName = getNullableTrimmedString(displayName);

  if (normalizedDisplayName) {
    return normalizedDisplayName;
  }

  const normalizedEmail = normalizeEmail(userEmail);
  const emailLocalPart = normalizedEmail.split("@")[0] ?? "workspace";
  return emailLocalPart || "workspace";
}

function createPersonalWorkspaceSlug(userId: string, value: string): string {
  const baseSlug = toWorkspaceSlug(value, MAX_WORKSPACE_SLUG_LENGTH - 7);
  const suffix = userId.slice(0, 6).toLowerCase();
  return trimSlugLength(`${baseSlug}-${suffix}`, MAX_WORKSPACE_SLUG_LENGTH);
}

function toWorkspaceSlug(value: string, maxLength = MAX_WORKSPACE_SLUG_LENGTH): string {
  const normalizedValue = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const fallbackValue = normalizedValue || "workspace";

  return trimSlugLength(fallbackValue, maxLength);
}

function trimSlugLength(value: string, maxLength: number): string {
  const normalizedValue = value.slice(0, maxLength).replace(/-+$/g, "");
  return normalizedValue || "workspace";
}

async function resolveUniqueWorkspaceSlug(
  pb: PocketBase,
  rawValue: string,
  currentWorkspaceId?: string
): Promise<string> {
  const baseSlug = toWorkspaceSlug(rawValue);

  for (let index = 0; index < 20; index += 1) {
    const suffix = index === 0 ? "" : `-${index + 1}`;
    const candidateBase = trimSlugLength(baseSlug, MAX_WORKSPACE_SLUG_LENGTH - suffix.length);
    const candidateSlug = `${candidateBase}${suffix}`;
    const existingWorkspace = await findWorkspaceBySlug(pb, candidateSlug);

    if (!existingWorkspace || existingWorkspace.id === currentWorkspaceId) {
      return candidateSlug;
    }
  }

  const fallbackSuffix = randomBytes(2).toString("hex");
  const fallbackBase = trimSlugLength(baseSlug, MAX_WORKSPACE_SLUG_LENGTH - fallbackSuffix.length - 1);
  return `${fallbackBase}-${fallbackSuffix}`;
}

async function findExistingPersonalWorkspace(
  pb: PocketBase,
  userId: string
): Promise<UserWorkspace | null> {
  const memberships = await listUserWorkspaceMemberships(pb, userId);

  return memberships.find((workspaceMembership) => workspaceMembership.kind === "personal") ?? null;
}

async function listUserWorkspaceMemberships(pb: PocketBase, userId: string): Promise<UserWorkspace[]> {
  const membershipRecords = await pb.collection("workspace_members").getFullList<WorkspaceMemberRecordWithExpand>({
    filter: pb.filter("user = {:userId}", { userId }),
    expand: "workspace",
    sort: "-created",
  });

  const workspaces = membershipRecords
    .map((membershipRecord) => {
      const expandedWorkspace = membershipRecord.expand?.workspace;

      if (!expandedWorkspace) {
        return null;
      }

      return mapUserWorkspaceSummary(pb, expandedWorkspace, membershipRecord);
    })
    .filter((workspace): workspace is UserWorkspace => workspace !== null);

  return workspaces.sort((firstWorkspace, secondWorkspace) => {
    if (firstWorkspace.kind === secondWorkspace.kind) {
      return firstWorkspace.name.localeCompare(secondWorkspace.name);
    }

    return firstWorkspace.kind === "personal" ? -1 : 1;
  });
}

async function findWorkspaceBySlug(
  pb: PocketBase,
  workspaceSlug: string
): Promise<WorkspacesRecord | null> {
  try {
    return await pb.collection("workspaces").getFirstListItem<WorkspacesRecord>(
      pb.filter("slug = {:workspaceSlug}", { workspaceSlug })
    );
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

async function findWorkspaceById(
  pb: PocketBase,
  workspaceId: string
): Promise<WorkspacesRecord | null> {
  try {
    return await pb.collection("workspaces").getOne<WorkspacesRecord>(workspaceId);
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

async function findWorkspaceMemberById(
  pb: PocketBase,
  workspaceId: string,
  memberId: string
): Promise<WorkspaceMembersRecord | null> {
  try {
    return await pb.collection("workspace_members").getFirstListItem<WorkspaceMembersRecord>(
      pb.filter("id = {:memberId} && workspace = {:workspaceId}", {
        memberId,
        workspaceId,
      })
    );
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

async function ensureWorkspaceMembership(
  pb: PocketBase,
  workspaceId: string,
  userId: string,
  role: WorkspaceMemberRole
): Promise<WorkspaceMembersRecord> {
  try {
    return await pb.collection("workspace_members").create<WorkspaceMembersRecord>({
      workspace: workspaceId,
      user: userId,
      role,
    });
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 400) {
      const membership = await findWorkspaceMembershipByWorkspaceAndUser(pb, workspaceId, userId);

      if (membership) {
        if (membership.role !== role) {
          return pb.collection("workspace_members").update<WorkspaceMembersRecord>(membership.id, {
            role,
          });
        }

        return membership;
      }
    }

    throw error;
  }
}

async function countWorkspaceOwners(pb: PocketBase, workspaceId: string): Promise<number> {
  const listResponse = await pb.collection("workspace_members").getList<WorkspaceMembersRecord>(1, 1, {
    filter: pb.filter("workspace = {:workspaceId} && role = 'owner'", { workspaceId }),
  });

  return listResponse.totalItems;
}

async function findInviteByHash(
  pb: PocketBase,
  inviteHash: string
): Promise<WorkspaceInvitesRecord | null> {
  try {
    return await pb.collection("workspace_invites").getFirstListItem<WorkspaceInvitesRecord>(
      pb.filter("token_hash = {:inviteHash}", { inviteHash })
    );
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

async function findInviteById(
  pb: PocketBase,
  workspaceId: string,
  inviteId: string
): Promise<WorkspaceInvitesRecord | null> {
  try {
    return await pb.collection("workspace_invites").getFirstListItem<WorkspaceInvitesRecord>(
      pb.filter("id = {:inviteId} && workspace = {:workspaceId}", {
        inviteId,
        workspaceId,
      })
    );
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

async function findInviteByWorkspaceAndEmail(
  pb: PocketBase,
  workspaceId: string,
  emailNormalized: string
): Promise<WorkspaceInvitesRecord | null> {
  try {
    return await pb.collection("workspace_invites").getFirstListItem<WorkspaceInvitesRecord>(
      pb.filter("workspace = {:workspaceId} && email_normalized = {:emailNormalized}", {
        workspaceId,
        emailNormalized,
      })
    );
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

async function safeDeleteInvite(pb: PocketBase, inviteId: string): Promise<void> {
  try {
    await pb.collection("workspace_invites").delete(inviteId);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return;
    }

    throw error;
  }
}

async function acceptInviteByHash(
  pb: PocketBase,
  inviteHash: string,
  user: {
    id: string;
    email: string;
  }
): Promise<WorkspaceInviteAcceptResult> {
  const inviteRecord = await findInviteByHash(pb, inviteHash);

  if (!inviteRecord) {
    return {
      state: "invalid_or_expired",
    };
  }

  if (isDateStringExpired(inviteRecord.expires_at)) {
    await safeDeleteInvite(pb, inviteRecord.id);
    return {
      state: "invalid_or_expired",
    };
  }

  const normalizedCurrentEmail = normalizeEmail(user.email);

  if (inviteRecord.email_normalized !== normalizedCurrentEmail) {
    return {
      state: "email_mismatch",
      invitedEmail: inviteRecord.email_normalized,
      currentEmail: normalizedCurrentEmail,
    };
  }

  const workspace = await findWorkspaceById(pb, inviteRecord.workspace);

  if (!workspace) {
    await safeDeleteInvite(pb, inviteRecord.id);
    return {
      state: "invalid_or_expired",
    };
  }

  const membership = await findWorkspaceMembershipByWorkspaceAndUser(pb, workspace.id, user.id);

  if (membership) {
    await safeDeleteInvite(pb, inviteRecord.id);
    return {
      state: "already_member",
      workspace: mapWorkspaceSummary(pb, workspace),
    };
  }

  await ensureWorkspaceMembership(pb, workspace.id, user.id, inviteRecord.role);
  await safeDeleteInvite(pb, inviteRecord.id);

  return {
    state: "accepted",
    workspace: mapWorkspaceSummary(pb, workspace),
  };
}

async function requireCurrentUser(): Promise<CurrentUser> {
  const { pb, hasAuthCookie, hadInvalidAuthCookie } = await createPocketBaseServerClient();

  if (hadInvalidAuthCookie) {
    return {
      ok: false,
      response: {
        ok: false,
        errorCode: "UNAUTHORIZED",
        setCookie: createClearedPocketBaseAuthCookies(),
      },
    };
  }

  if (!pb.authStore.isValid || !pb.authStore.record) {
    return {
      ok: false,
      response: {
        ok: false,
        errorCode: "UNAUTHORIZED",
        ...(hasAuthCookie ? { setCookie: createClearedPocketBaseAuthCookies() } : {}),
      },
    };
  }

  if (!isUsersRecord(pb.authStore.record)) {
    return {
      ok: false,
      response: {
        ok: false,
        errorCode: "UNAUTHORIZED",
        setCookie: createClearedPocketBaseAuthCookies(),
      },
    };
  }

  return {
    ok: true,
    pb,
    user: pb.authStore.record,
  };
}

async function requireWorkspaceAccess(workspaceSlug: string): Promise<WorkspaceAccessResult> {
  const currentUser = await requireCurrentUser();

  if (!currentUser.ok) {
    return currentUser;
  }

  const workspace = await findWorkspaceBySlug(currentUser.pb, workspaceSlug);

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
    currentUser.pb,
    workspace.id,
    currentUser.user.id
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
    pb: currentUser.pb,
    user: currentUser.user,
    workspace,
    membership,
  };
}

async function requireOwnerWorkspaceAccess(workspaceSlug: string): Promise<OwnerWorkspaceAccessResult> {
  const access = await requireWorkspaceAccess(workspaceSlug);

  if (!access.ok) {
    return access;
  }

  if (access.membership.role !== "owner") {
    return {
      ok: false,
      response: {
        ok: false,
        errorCode: "FORBIDDEN",
      },
    };
  }

  return access;
}

function mapWorkspaceErrorCode(
  error: unknown,
  operationMapper: (error: ClientResponseError) => WorkspaceErrorCode | null
): WorkspaceErrorCode {
  if (error instanceof ClientResponseError) {
    if (error.status === 429) {
      return "RATE_LIMITED";
    }

    const mappedCode = operationMapper(error);

    if (mappedCode) {
      return mappedCode;
    }
  }

  return "UNKNOWN_ERROR";
}

function sortWorkspaceMembers(
  firstMember: WorkspaceMemberSummary,
  secondMember: WorkspaceMemberSummary
): number {
  if (firstMember.role === secondMember.role) {
    return firstMember.email.localeCompare(secondMember.email);
  }

  return firstMember.role === "owner" ? -1 : 1;
}

async function sendWorkspaceInviteEmail(input: {
  email: string;
  workspaceName: string;
  inviterName: string | null;
  inviteToken: string;
}): Promise<void> {
  const inviteUrl = createWorkspaceInviteUrl(input.inviteToken);
  const safeWorkspaceName = escapeHtml(input.workspaceName);
  const inviterLine = input.inviterName
    ? `Invited by ${escapeHtml(input.inviterName)}`
    : "You were invited";

  await sendEmail({
    to: input.email,
    subject: `Invitation to ${input.workspaceName}`,
    html: `
      <h2>Workspace invitation</h2>
      <p>${inviterLine} to join <strong>${safeWorkspaceName}</strong>.</p>
      <p><a href="${escapeHtml(inviteUrl)}">Accept invitation</a></p>
      <p>This invite expires in ${INVITE_TTL_DAYS} days.</p>
    `,
    text: [
      "Workspace invitation",
      "",
      `${inviterLine} to join ${input.workspaceName}.`,
      "",
      `Accept invitation: ${inviteUrl}`,
      "",
      `This invite expires in ${INVITE_TTL_DAYS} days.`,
    ].join("\n"),
  });
}

function createWorkspaceInviteUrl(inviteToken: string): string {
  const baseUrl = getWorkspaceInviteBaseUrl().replace(/\/+$/g, "");
  const encodedToken = encodeURIComponent(inviteToken);

  return `${baseUrl}/invite/${encodedToken}`;
}

function getWorkspaceInviteBaseUrl(): string {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (explicitUrl) {
    return explicitUrl;
  }

  return site.url;
}

function logWorkspaceServiceError(context: string, error: unknown): void {
  logServiceError("workspace-service", context, error);
}
