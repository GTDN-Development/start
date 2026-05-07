import type { WorkspaceInvitesRecord } from "@/types/pocketbase";
import type { AppLocale } from "@/i18n/routing";
import { workspaceConfig } from "@/config/workspace";
import { getNullableTrimmedString } from "@/server/pocketbase/pocketbase-utils";
import { sendWorkspaceInviteEmail } from "@/server/workspaces/workspace-invite-mailer";
import {
  createInviteExpiryDate,
  createInviteToken,
  hashInviteToken,
  isDateStringExpired,
} from "@/server/workspaces/workspace-invite-utils";
import {
  findInviteById,
  mapMutationStatusError,
  safeDeleteRecord,
} from "@/server/workspaces/workspace-mutation-utils";
import { normalizeEmail } from "@/server/workspaces/workspace-normalization";
import { resolveWorkspaceActionAccess } from "@/server/workspaces/workspace-route-queries";
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

export async function createInvite(
  workspaceSlug: string,
  input: CreateWorkspaceInviteInput
): Promise<ServerWorkspaceResponse<{ invite: WorkspaceInviteSummary }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);
  const normalizedEmail = normalizeEmail(input.email);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  if (!normalizedEmail) {
    return {
      ok: false,
      errorCode: "BAD_REQUEST",
    };
  }

  try {
    const { pb, user, workspace } = workspaceAccess.context;
    const inviteToken = createInviteToken();
    const inviteRecord = await pb.collection("workspace_invites").create<WorkspaceInvitesRecord>({
      workspace: workspace.id,
      email_normalized: normalizedEmail,
      role: input.role,
      token_hash: hashInviteToken(inviteToken),
      expires_at: createInviteExpiryDate(),
      invited_by: user.id,
    });

    await sendWorkspaceInviteEmail({
      locale: input.locale,
      email: normalizedEmail,
      workspaceName: workspace.name,
      inviterName: getNullableTrimmedString(user.name),
      inviteToken,
    });

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
        },
      },
    };
  } catch (error) {
    return mapMutationStatusError("createInvite", error, {
      400: "BAD_REQUEST",
      403: "FORBIDDEN",
      404: "FORBIDDEN",
    });
  }
}

export async function resendInvite(
  workspaceSlug: string,
  inviteId: string,
  locale: AppLocale
): Promise<ServerWorkspaceResponse<{ inviteId: string; expiresAt: string; updatedAt: string }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);

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
      await safeDeleteRecord(pb, "workspace_invites", inviteRecord.id);

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
    const updatedInviteRecord = await pb
      .collection("workspace_invites")
      .update<WorkspaceInvitesRecord>(inviteRecord.id, {
        token_hash: hashInviteToken(nextInviteToken),
        expires_at: createInviteExpiryDate(),
      });

    await sendWorkspaceInviteEmail({
      locale,
      email: inviteRecord.email_normalized,
      workspaceName: workspace.name,
      inviterName: getNullableTrimmedString(user.name),
      inviteToken: nextInviteToken,
    });

    return {
      ok: true,
      data: {
        inviteId: updatedInviteRecord.id,
        expiresAt: updatedInviteRecord.expires_at,
        updatedAt: updatedInviteRecord.updated,
      },
    };
  } catch (error) {
    return mapMutationStatusError("resendInvite", error, {
      400: "BAD_REQUEST",
      403: "FORBIDDEN",
      404: "NOT_FOUND",
    });
  }
}

export async function revokeInvite(
  workspaceSlug: string,
  inviteId: string
): Promise<ServerWorkspaceResponse<{ revoked: true }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);

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
    return mapMutationStatusError("revokeInvite", error, {
      403: "FORBIDDEN",
      404: "NOT_FOUND",
    });
  }
}
