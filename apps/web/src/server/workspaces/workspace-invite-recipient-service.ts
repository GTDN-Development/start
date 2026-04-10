import type PocketBase from "pocketbase";
import type { WorkspaceInvitesRecord, WorkspacesRecord } from "@/types/pocketbase";
import { createPocketBaseClient, createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
import { mapWorkspaceSummary } from "@/server/workspaces/workspace-mappers";
import { normalizeEmail } from "@/server/workspaces/workspace-normalization";
import {
  countWorkspaceMembers,
  ensureWorkspaceMembership,
  findInviteByHash,
  findWorkspaceById,
  findWorkspaceMembershipByWorkspaceAndUser,
  safeDeleteInvite,
} from "@/server/workspaces/workspace-repository";
import { hashInviteToken, isDateStringExpired } from "@/server/workspaces/workspace-invite-utils";
import type {
  ServerWorkspaceResponse,
  WorkspaceInviteAcceptResult,
  WorkspaceInviteInspectResult,
  WorkspaceSummary,
} from "@/server/workspaces/workspace-types";

type InviteRecipientUser = {
  id: string;
  email: string;
};

export async function validateInviteToken(
  inviteToken: string
): Promise<ServerWorkspaceResponse<{ isValid: boolean }>> {
  const pb = createPocketBaseClient();

  try {
    const response = await pb.send<{
      state: "invalid_or_expired" | "valid_guest";
    }>("/api/start/workspace-invites/inspect", {
      method: "POST",
      body: {
        token: inviteToken,
      },
    });

    return {
      ok: true,
      data: {
        isValid: response.state === "valid_guest",
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, function mapInviteErrorCode(pocketBaseError) {
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

export async function getInviteTokenForUser(
  inviteToken: string
): Promise<ServerWorkspaceResponse<{ result: WorkspaceInviteInspectResult }>> {
  const { pb } = await createPocketBaseServerClient();

  try {
    const inspectResult = await pb.send<PocketBaseInviteInspectResponse>(
      "/api/start/workspace-invites/inspect",
      {
        method: "POST",
        body: {
          token: inviteToken,
        },
      }
    );

    if (inspectResult.state === "invalid_or_expired") {
      return {
        ok: true,
        data: {
          result: {
            state: "invalid_or_expired",
          },
        },
      };
    }

    if (inspectResult.state === "email_mismatch") {
      return {
        ok: true,
        data: {
          result: {
            state: "email_mismatch",
            invitedEmail: inspectResult.invitedEmail,
            currentEmail: inspectResult.currentEmail,
          },
        },
      };
    }

    if (inspectResult.state === "valid_guest") {
      return {
        ok: true,
        data: {
          result: {
            state: "invalid_or_expired",
          },
        },
      };
    }

    const workspace = await findWorkspaceById(pb, inspectResult.workspaceId);

    if (!workspace) {
      return {
        ok: true,
        data: {
          result: {
            state: "invalid_or_expired",
          },
        },
      };
    }

    return {
      ok: true,
      data: {
        result: inspectResult.state === "already_member"
          ? {
              state: "already_member",
              workspace: await mapWorkspaceSummaryWithMemberCount(pb, workspace),
            }
          : {
              state: "pending",
              workspace: mapWorkspaceSummary(pb, workspace, 0),
            },
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, function mapInviteErrorCode(pocketBaseError) {
      if (pocketBaseError.status === 404) {
        return "INVITE_INVALID_OR_EXPIRED";
      }

      if (pocketBaseError.status === 403) {
        return "FORBIDDEN";
      }

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("getInviteTokenForUser", error);
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export async function acceptInviteTokenForUser(
  inviteToken: string,
  user: InviteRecipientUser
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
    const errorCode = mapWorkspaceErrorCode(error, function mapInviteErrorCode(pocketBaseError) {
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

async function acceptInviteByHash(
  pb: PocketBase,
  inviteHash: string,
  user: InviteRecipientUser
): Promise<WorkspaceInviteAcceptResult> {
  const result = await validateInviteByHashForUser(pb, inviteHash, user);

  if (result.state === "invalid_or_expired" || result.state === "email_mismatch") {
    return result;
  }

  if (result.alreadyMember) {
    await safeDeleteInvite(pb, result.inviteRecord.id);

    return {
      state: "already_member",
      workspace: await mapWorkspaceSummaryWithMemberCount(pb, result.workspace),
    };
  }

  await ensureWorkspaceMembership(pb, result.workspace.id, user.id, result.inviteRecord.role);
  await safeDeleteInvite(pb, result.inviteRecord.id);

  return {
    state: "accepted",
    workspace: await mapWorkspaceSummaryWithMemberCount(pb, result.workspace),
  };
}

async function validateInviteByHashForUser(
  pb: PocketBase,
  inviteHash: string,
  user: InviteRecipientUser
): Promise<ValidatedInviteForUserResult> {
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

  return {
    state: "ready",
    inviteRecord,
    workspace,
    alreadyMember: membership !== null,
  };
}

async function mapWorkspaceSummaryWithMemberCount(
  pb: PocketBase,
  workspace: WorkspacesRecord
): Promise<WorkspaceSummary> {
  return mapWorkspaceSummary(pb, workspace, await countWorkspaceMembers(pb, workspace.id));
}

type ValidatedInviteForUserResult =
  | {
      state: "invalid_or_expired";
    }
  | {
      state: "email_mismatch";
      invitedEmail: string;
      currentEmail: string;
    }
  | {
      state: "ready";
      inviteRecord: WorkspaceInvitesRecord;
      workspace: WorkspacesRecord;
      alreadyMember: boolean;
    };

type PocketBaseInviteInspectResponse =
  | {
      state: "invalid_or_expired";
    }
  | {
      state: "valid_guest";
    }
  | {
      state: "email_mismatch";
      invitedEmail: string;
      currentEmail: string;
    }
  | {
      state: "pending" | "already_member";
      workspaceId: string;
    };
