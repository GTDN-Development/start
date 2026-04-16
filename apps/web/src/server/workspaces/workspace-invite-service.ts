import type PocketBase from "pocketbase";
import type { WorkspaceInvitesRecord } from "@/types/pocketbase";
import type { AppLocale } from "@/i18n/routing";
import { workspaceConfig } from "@/config/workspace";
import { getNullableTrimmedString, hasValidationCode } from "@/server/pocketbase/pocketbase-utils";
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
import { createWorkspaceInviteUrl } from "@/server/workspaces/workspace-invite-url";
import { mapWorkspaceInviteSummary } from "@/server/workspaces/workspace-mappers";
import {
  requireWorkspaceActionMembershipContext,
  requireWorkspaceMembershipContext,
} from "@/server/workspaces/workspace-resolution-service";
import { normalizeEmail } from "@/server/workspaces/workspace-normalization";
import {
  findInviteById,
  findInviteByWorkspaceAndEmail,
  listWorkspaceInviteRecordsByWorkspace,
  listWorkspaceMemberRecordsByWorkspace,
  safeDeleteInvite,
} from "@/server/workspaces/workspace-repository";
import type {
  ServerWorkspaceResponse,
  WorkspaceInviteRole,
  WorkspaceInviteSummary,
} from "@/server/workspaces/workspace-types";

export type CreateWorkspaceInviteInput = {
  locale: AppLocale;
  email: string;
  role: WorkspaceInviteRole;
};

export async function listWorkspaceInvites(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ invites: WorkspaceInviteSummary[] }>> {
  const workspaceAccess = await requireWorkspaceMembershipContext(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  const { pb, workspace } = workspaceAccess.context;

  return listWorkspaceInvitesWithClient(pb, workspace.id);
}

export async function listWorkspaceInvitesWithClient(
  pb: PocketBase,
  workspaceId: string
): Promise<ServerWorkspaceResponse<{ invites: WorkspaceInviteSummary[] }>> {
  try {
    const inviteRecords = await listWorkspaceInviteRecordsByWorkspace(pb, workspaceId);
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
    const errorCode = mapWorkspaceErrorCode(error, function mapListInvitesError(pocketBaseError) {
      if (pocketBaseError.status === 404) {
        return "NOT_FOUND";
      }

      if (pocketBaseError.status === 403) {
        return "FORBIDDEN";
      }

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("listWorkspaceInvitesWithClient", error);
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
): Promise<ServerWorkspaceResponse<{ invite: WorkspaceInviteSummary }>> {
  const workspaceAccess = await requireWorkspaceActionMembershipContext(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  const normalizedEmail = normalizeEmail(input.email);

  if (!normalizedEmail) {
    return {
      ok: false,
      errorCode: "BAD_REQUEST",
    };
  }

  try {
    const { pb, user, workspace } = workspaceAccess.context;
    const workspaceMembers = await listWorkspaceMemberRecordsByWorkspace(pb, workspace.id);

    if (hasMemberWithEmail(workspaceMembers, normalizedEmail)) {
      return {
        ok: false,
        errorCode: "BAD_REQUEST",
      };
    }

    const existingInviteRecord = await findInviteByWorkspaceAndEmail(
      pb,
      workspace.id,
      normalizedEmail
    );

    if (existingInviteRecord && !isDateStringExpired(existingInviteRecord.expires_at)) {
      return {
        ok: false,
        errorCode: "BAD_REQUEST",
      };
    }

    if (existingInviteRecord && isDateStringExpired(existingInviteRecord.expires_at)) {
      await safeDeleteInvite(pb, existingInviteRecord.id);
    }

    const inviteToken = createInviteToken();
    const inviteHash = hashInviteToken(inviteToken);
    const inviteRecord = await pb.collection("workspace_invites").create<WorkspaceInvitesRecord>({
      workspace: workspace.id,
      email_normalized: normalizedEmail,
      role: input.role,
      token_hash: inviteHash,
      expires_at: createInviteExpiryDate(),
      invited_by: user.id,
    });

    try {
      await sendWorkspaceInviteEmail({
        locale: input.locale,
        email: normalizedEmail,
        workspaceName: workspace.name,
        inviterName: getNullableTrimmedString(user.name),
        inviteToken,
      });
    } catch (emailError) {
      logWorkspaceServiceError(
        "createWorkspaceInviteForCurrentUser.sendWorkspaceInviteEmail",
        emailError
      );

      await safeDeleteInvite(pb, inviteRecord.id);

      return {
        ok: false,
        errorCode: "UNKNOWN_ERROR",
      };
    }

    return {
      ok: true,
      data: {
        invite: {
          id: inviteRecord.id,
          emailNormalized: inviteRecord.email_normalized,
          role: inviteRecord.role,
          expiresAt: inviteRecord.expires_at,
          updatedAt: inviteRecord.updated,
          invitedByName: getNullableTrimmedString(user.name),
          inviteUrl: createWorkspaceInviteUrl(inviteToken, input.locale),
        },
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, function mapCreateInviteError(pocketBaseError) {
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

      if (pocketBaseError.status === 404) {
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
): Promise<
  ServerWorkspaceResponse<{
    inviteId: string;
    expiresAt: string;
    updatedAt: string;
    inviteUrl: string;
  }>
> {
  const workspaceAccess = await requireWorkspaceActionMembershipContext(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { pb, user, workspace } = workspaceAccess.context;
    const inviteRecord = await findInviteById(pb, workspace.id, inviteId);

    if (!inviteRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (isDateStringExpired(inviteRecord.expires_at)) {
      await safeDeleteInvite(pb, inviteRecord.id);

      return {
        ok: false,
        errorCode: "INVITE_INVALID_OR_EXPIRED",
      };
    }

    const inviteLastUpdatedAt = Date.parse(inviteRecord.updated);

    if (
      Number.isFinite(inviteLastUpdatedAt) &&
      Date.now() - inviteLastUpdatedAt < workspaceConfig.invites.resendCooldownSeconds * 1000
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

    const updatedInviteRecord = await pb
      .collection("workspace_invites")
      .update<WorkspaceInvitesRecord>(inviteRecord.id, {
        token_hash: nextInviteHash,
        expires_at: createInviteExpiryDate(),
      });

    try {
      await sendWorkspaceInviteEmail({
        locale,
        email: inviteRecord.email_normalized,
        workspaceName: workspace.name,
        inviterName: getNullableTrimmedString(user.name),
        inviteToken: nextInviteToken,
      });
    } catch (emailError) {
      logWorkspaceServiceError(
        "resendWorkspaceInviteForCurrentUser.sendWorkspaceInviteEmail",
        emailError
      );

      await rollbackInviteAfterFailedResend(pb, inviteRecord.id, {
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
        inviteId: updatedInviteRecord.id,
        expiresAt: updatedInviteRecord.expires_at,
        updatedAt: updatedInviteRecord.updated,
        inviteUrl: createWorkspaceInviteUrl(nextInviteToken, locale),
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, function mapResendInviteError(pocketBaseError) {
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

export async function refreshWorkspaceInviteLinkForCurrentUser(
  workspaceSlug: string,
  inviteId: string,
  locale: AppLocale
): Promise<
  ServerWorkspaceResponse<{
    inviteId: string;
    expiresAt: string;
    updatedAt: string;
    inviteUrl: string;
  }>
> {
  const workspaceAccess = await requireWorkspaceActionMembershipContext(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { pb, workspace } = workspaceAccess.context;
    const inviteRecord = await findInviteById(pb, workspace.id, inviteId);

    if (!inviteRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (isDateStringExpired(inviteRecord.expires_at)) {
      await safeDeleteInvite(pb, inviteRecord.id);

      return {
        ok: false,
        errorCode: "INVITE_INVALID_OR_EXPIRED",
      };
    }

    const nextInviteToken = createInviteToken();
    const nextInviteHash = hashInviteToken(nextInviteToken);
    const updatedInviteRecord = await pb
      .collection("workspace_invites")
      .update<WorkspaceInvitesRecord>(inviteRecord.id, {
        token_hash: nextInviteHash,
        expires_at: createInviteExpiryDate(),
      });

    return {
      ok: true,
      data: {
        inviteId: updatedInviteRecord.id,
        expiresAt: updatedInviteRecord.expires_at,
        updatedAt: updatedInviteRecord.updated,
        inviteUrl: createWorkspaceInviteUrl(nextInviteToken, locale),
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(
      error,
      function mapRefreshInviteLinkError(pocketBaseError) {
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
      }
    );

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("refreshWorkspaceInviteLinkForCurrentUser", error);
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
  const workspaceAccess = await requireWorkspaceActionMembershipContext(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { pb, workspace } = workspaceAccess.context;
    const inviteRecord = await findInviteById(pb, workspace.id, inviteId);

    if (!inviteRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    await pb.collection("workspace_invites").delete(inviteRecord.id);

    return {
      ok: true,
      data: {
        revoked: true,
      },
    };
  } catch (error) {
    const errorCode = mapWorkspaceErrorCode(error, function mapRevokeInviteError(pocketBaseError) {
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

function hasMemberWithEmail(
  memberRecords: Awaited<ReturnType<typeof listWorkspaceMemberRecordsByWorkspace>>,
  normalizedEmail: string
): boolean {
  return memberRecords.some(function hasMemberRecordWithEmail(memberRecord) {
    const memberEmail = memberRecord.expand?.user?.email;

    if (!memberEmail) {
      return false;
    }

    return normalizeEmail(memberEmail) === normalizedEmail;
  });
}
