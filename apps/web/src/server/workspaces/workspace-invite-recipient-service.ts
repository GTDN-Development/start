import type PocketBase from "pocketbase";
import type { WorkspaceInvitesRecord, WorkspacesRecord } from "@/types/pocketbase";
import {
  createPocketBaseClient,
  createPocketBaseServerClient,
} from "@/server/pocketbase/pocketbase-server";
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
  try {
    const guestInspectState = await inspectInviteTokenAsGuest(inviteToken);

    return {
      ok: true,
      data: {
        isValid: guestInspectState === "valid_guest",
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
    const result = await inspectInviteForUser(pb, inviteToken, user);

    if (result.state === "invalid_or_expired" || result.state === "email_mismatch") {
      return {
        ok: true,
        data: {
          result,
        },
      };
    }

    return {
      ok: true,
      data: {
        result: result.alreadyMember
          ? {
              state: "already_member",
              workspace: mapWorkspaceSummary(pb, result.workspace),
            }
          : {
              state: "pending",
              workspace: mapWorkspaceSummary(pb, result.workspace),
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
    const result = await acceptInviteByToken(pb, inviteToken, user);

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

async function acceptInviteByToken(
  pb: PocketBase,
  inviteToken: string,
  user: InviteRecipientUser
): Promise<WorkspaceInviteAcceptResult> {
  const result = await inspectInviteForUser(pb, inviteToken, user);

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

async function inspectInviteForUser(
  pb: PocketBase,
  inviteToken: string,
  user: InviteRecipientUser
): Promise<ResolvedInviteForUserResult> {
  const inviteHash = hashInviteToken(inviteToken);
  const result = await validateInviteByHashForUser(pb, inviteHash, user);

  if (result.state !== "direct_read_miss") {
    return result;
  }

  const guestInspectState = await inspectInviteTokenAsGuest(inviteToken);

  if (guestInspectState === "valid_guest") {
    return {
      state: "email_mismatch",
    };
  }

  return {
    state: "invalid_or_expired",
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
      state: "direct_read_miss",
    };
  }

  if (isDateStringExpired(inviteRecord.expires_at)) {
    await safeDeleteInvite(pb, inviteRecord.id);

    return {
      state: "invalid_or_expired",
    };
  }

  if (inviteRecord.email_normalized !== normalizeEmail(user.email)) {
    return {
      state: "email_mismatch",
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

async function inspectInviteTokenAsGuest(
  inviteToken: string
): Promise<PocketBaseInviteInspectState> {
  const pb = createPocketBaseClient();
  const response = await pb.send<{
    state: PocketBaseInviteInspectState;
  }>("/api/start/workspace-invites/inspect", {
    method: "POST",
    body: {
      token: inviteToken,
    },
  });

  return response.state;
}

type ValidatedInviteForUserResult =
  | {
      state: "direct_read_miss";
    }
  | {
      state: "invalid_or_expired";
    }
  | {
      state: "email_mismatch";
    }
  | {
      state: "ready";
      inviteRecord: WorkspaceInvitesRecord;
      workspace: WorkspacesRecord;
      alreadyMember: boolean;
    };

type ResolvedInviteForUserResult = Exclude<
  ValidatedInviteForUserResult,
  { state: "direct_read_miss" }
>;

type PocketBaseInviteInspectState = "invalid_or_expired" | "valid_guest";
