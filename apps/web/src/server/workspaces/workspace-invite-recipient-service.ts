import type PocketBase from "pocketbase";
import type { WorkspaceInvitesRecord, WorkspacesRecord } from "@/types/pocketbase";
import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
import { mapWorkspaceSummary } from "@/server/workspaces/workspace-mappers";
import { normalizeEmail } from "@/server/workspaces/workspace-normalization";
import {
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
} from "@/server/workspaces/workspace-types";

type InviteRecipientUser = {
  id: string;
  email: string;
};

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
  inviteToken: string,
  user: InviteRecipientUser
): Promise<ServerWorkspaceResponse<{ result: WorkspaceInviteInspectResult }>> {
  const { pb } = await createPocketBaseServerClient();

  try {
    const inviteHash = hashInviteToken(inviteToken);
    const result = await validateInviteByHashForUser(pb, inviteHash, user);

    if (result.state === "invalid_or_expired" || result.state === "email_mismatch") {
      return {
        ok: true,
        data: {
          result,
        },
      };
    }

    const workspace = mapWorkspaceSummary(pb, result.workspace);

    return {
      ok: true,
      data: {
        result: result.alreadyMember
          ? {
              state: "already_member",
              workspace,
            }
          : {
              state: "pending",
              workspace,
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
      workspace: mapWorkspaceSummary(pb, result.workspace),
    };
  }

  await ensureWorkspaceMembership(pb, result.workspace.id, user.id, result.inviteRecord.role);
  await safeDeleteInvite(pb, result.inviteRecord.id);

  return {
    state: "accepted",
    workspace: mapWorkspaceSummary(pb, result.workspace),
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
