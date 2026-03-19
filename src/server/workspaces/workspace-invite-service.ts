import type PocketBase from "pocketbase";
import type { WorkspaceInvitesRecord } from "@/types/pocketbase";
import type { AppLocale } from "@/i18n/routing";
import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import { getNullableTrimmedString, hasValidationCode } from "@/server/pocketbase/pocketbase-utils";
import {
  clearPendingInviteHashCookie,
  getPendingInviteHashCookie,
} from "@/server/workspaces/workspace-cookie";
import {
  requireOwnerWorkspaceAccessBySlug,
  requireWorkspaceAccess,
} from "@/server/workspaces/workspace-access";
import { requireWorkspaceAuthContext } from "@/server/workspaces/workspace-auth-context";
import { INVITE_RESEND_COOLDOWN_SECONDS } from "@/server/workspaces/workspace-constants";
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
import { sendWorkspaceInviteEmail } from "@/server/workspaces/workspace-invite-mailer";
import {
  createInviteExpiryDate,
  createInviteToken,
  hashInviteToken,
  isDateStringExpired,
} from "@/server/workspaces/workspace-invite-utils";
import {
  mapWorkspaceInviteSummary,
  mapWorkspaceSummary,
} from "@/server/workspaces/workspace-mappers";
import { normalizeEmail } from "@/server/workspaces/workspace-normalization";
import {
  ensureWorkspaceMembership,
  findInviteByHash,
  findInviteById,
  findInviteByWorkspaceAndEmail,
  findWorkspaceById,
  findWorkspaceMembershipByWorkspaceAndUser,
  listWorkspaceInviteRecordsByWorkspace,
  listWorkspaceMemberRecordsByWorkspace,
  safeDeleteInvite,
} from "@/server/workspaces/workspace-repository";
import type {
  PendingInviteConsumeResult,
  ServerWorkspaceResponse,
  WorkspaceInviteAcceptResult,
  WorkspaceInviteSummary,
} from "@/server/workspaces/workspace-types";

export { hashInviteToken };
export type CreateWorkspaceInviteInput = {
  locale: AppLocale;
  email: string;
  role: "member";
};

export async function listWorkspaceInvites(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ invites: WorkspaceInviteSummary[] }>> {
  const currentUser = await requireWorkspaceAuthContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  try {
    const access = await requireWorkspaceAccess(currentUser.context, workspaceSlug);

    if (!access.ok) {
      return access.response;
    }

    const inviteRecords = await listWorkspaceInviteRecordsByWorkspace(
      access.context.pb,
      access.context.workspace.id
    );
    const now = Date.now();
    const invites = inviteRecords
      .filter((inviteRecord) => !isDateStringExpired(inviteRecord.expires_at, now))
      .map((inviteRecord) => mapWorkspaceInviteSummary(inviteRecord));

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
    const errorCode = mapWorkspaceErrorCode(error, (pocketBaseError) => {
      if (pocketBaseError.status === 404) {
        return "INVITE_INVALID_OR_EXPIRED";
      }

      if (pocketBaseError.status === 403) {
        return "FORBIDDEN";
      }

      return null;
    });

    // Only clear the cookie on terminal errors — keep it for transient failures
    // so the user can retry after signing in again.
    if (errorCode !== "UNKNOWN_ERROR") {
      await clearPendingInviteHashCookie();
    }

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

export async function createWorkspaceInviteForCurrentUser(
  workspaceSlug: string,
  input: CreateWorkspaceInviteInput
): Promise<ServerWorkspaceResponse<{ created: true }>> {
  const currentUser = await requireWorkspaceAuthContext();

  if (!currentUser.ok) {
    return currentUser.response;
  }

  const normalizedEmail = normalizeEmail(input.email);

  if (!normalizedEmail) {
    return {
      ok: false,
      errorCode: "BAD_REQUEST",
    };
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

    const workspaceMembers = await listWorkspaceMemberRecordsByWorkspace(
      ownerAccess.context.pb,
      ownerAccess.context.workspace.id
    );

    if (hasMemberWithEmail(workspaceMembers, normalizedEmail)) {
      return {
        ok: false,
        errorCode: "BAD_REQUEST",
      };
    }

    const existingInviteRecord = await findInviteByWorkspaceAndEmail(
      ownerAccess.context.pb,
      ownerAccess.context.workspace.id,
      normalizedEmail
    );

    if (existingInviteRecord && !isDateStringExpired(existingInviteRecord.expires_at)) {
      return {
        ok: false,
        errorCode: "BAD_REQUEST",
      };
    }

    if (existingInviteRecord && isDateStringExpired(existingInviteRecord.expires_at)) {
      await safeDeleteInvite(ownerAccess.context.pb, existingInviteRecord.id);
    }

    const inviteToken = createInviteToken();
    const inviteHash = hashInviteToken(inviteToken);
    const inviteRecord = await ownerAccess.context.pb
      .collection("workspace_invites")
      .create<WorkspaceInvitesRecord>({
        workspace: ownerAccess.context.workspace.id,
        email_normalized: normalizedEmail,
        role: input.role,
        token_hash: inviteHash,
        expires_at: createInviteExpiryDate(),
        invited_by: ownerAccess.context.user.id,
      });

    try {
      await sendWorkspaceInviteEmail({
        locale: input.locale,
        email: normalizedEmail,
        workspaceName: ownerAccess.context.workspace.name,
        inviterName: getNullableTrimmedString(ownerAccess.context.user.name),
        inviteToken,
      });
    } catch (emailError) {
      logWorkspaceServiceError(
        "createWorkspaceInviteForCurrentUser.sendWorkspaceInviteEmail",
        emailError
      );

      await safeDeleteInvite(ownerAccess.context.pb, inviteRecord.id);

      return {
        ok: false,
        errorCode: "UNKNOWN_ERROR",
      };
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
  inviteId: string,
  locale: AppLocale
): Promise<ServerWorkspaceResponse<{ resent: true }>> {
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

    const inviteRecord = await findInviteById(
      ownerAccess.context.pb,
      ownerAccess.context.workspace.id,
      inviteId
    );

    if (!inviteRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (isDateStringExpired(inviteRecord.expires_at)) {
      await safeDeleteInvite(ownerAccess.context.pb, inviteRecord.id);

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
    const previousInviteTokenHash = inviteRecord.token_hash;
    const previousInviteExpiresAt = inviteRecord.expires_at;

    await ownerAccess.context.pb.collection("workspace_invites").update(inviteRecord.id, {
      token_hash: nextInviteHash,
      expires_at: createInviteExpiryDate(),
    });

    try {
      await sendWorkspaceInviteEmail({
        locale,
        email: inviteRecord.email_normalized,
        workspaceName: ownerAccess.context.workspace.name,
        inviterName: getNullableTrimmedString(ownerAccess.context.user.name),
        inviteToken: nextInviteToken,
      });
    } catch (emailError) {
      logWorkspaceServiceError(
        "resendWorkspaceInviteForCurrentUser.sendWorkspaceInviteEmail",
        emailError
      );

      await rollbackInviteAfterFailedResend(ownerAccess.context.pb, inviteRecord.id, {
        tokenHash: previousInviteTokenHash,
        expiresAt: previousInviteExpiresAt,
      });

      return {
        ok: false,
        errorCode: "UNKNOWN_ERROR",
      };
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

    const inviteRecord = await findInviteById(
      ownerAccess.context.pb,
      ownerAccess.context.workspace.id,
      inviteId
    );

    if (!inviteRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    await ownerAccess.context.pb.collection("workspace_invites").delete(inviteRecord.id);

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

async function rollbackInviteAfterFailedResend(
  pb: PocketBase,
  inviteId: string,
  previousInvite: {
    tokenHash: string;
    expiresAt: string;
  }
): Promise<void> {
  try {
    await pb.collection("workspace_invites").update(inviteId, {
      token_hash: previousInvite.tokenHash,
      expires_at: previousInvite.expiresAt,
    });
  } catch (error) {
    logWorkspaceServiceError("rollbackInviteAfterFailedResend", error);
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

function hasMemberWithEmail(
  memberRecords: Awaited<ReturnType<typeof listWorkspaceMemberRecordsByWorkspace>>,
  normalizedEmail: string
): boolean {
  return memberRecords.some((memberRecord) => {
    const memberEmail = memberRecord.expand?.user?.email;

    if (!memberEmail) {
      return false;
    }

    return normalizeEmail(memberEmail) === normalizedEmail;
  });
}
