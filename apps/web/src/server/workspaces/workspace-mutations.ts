import PocketBase, { ClientResponseError } from "pocketbase";
import type {
  WorkspaceInvitesRecord,
  WorkspaceMembersRecord,
  WorkspacesRecord,
} from "@/types/pocketbase";
import type { AppLocale } from "@/i18n/routing";
import { workspaceConfig } from "@/config/workspace";
import { toWorkspaceSlug } from "@/features/workspaces/workspace-slug";
import { getNullableTrimmedString, hasValidationCode } from "@/server/pocketbase/pocketbase-utils";
import {
  normalizeEmail,
  normalizeWorkspaceName,
} from "@/server/workspaces/workspace-normalization";
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
import { mapUserWorkspaceSummary } from "@/server/workspaces/workspace-mappers";
import { resolveWorkspaceActionAccess } from "@/server/workspaces/workspace-route-queries";
import { requireCurrentWritableUser } from "@/server/auth/auth-session-service";
import type {
  ServerWorkspaceResponse,
  UserWorkspace,
  WorkspaceInviteRole,
  WorkspaceInviteSummary,
  WorkspaceMemberRole,
} from "@/server/workspaces/workspace-types";

export type CreateWorkspaceInput = {
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
  locale: AppLocale;
  email: string;
  role: WorkspaceInviteRole;
};

export const workspaceMutations = {
  createWorkspace,
  updateWorkspaceGeneral,
  deleteWorkspace,
  leaveWorkspace,
  changeMemberRole,
  removeMember,
  createInvite,
  resendInvite,
  revokeInvite,
};

async function createWorkspace(
  input: CreateWorkspaceInput
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace }>> {
  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.setCookie ? { setCookie: currentUser.setCookie } : {}),
    };
  }

  try {
    const response = await currentUser.pb.send<{ workspace: UserWorkspace }>(
      "/api/start/workspaces",
      {
        method: "POST",
        body: {
          name: input.name,
          ...(input.slug ? { slug: input.slug } : {}),
        },
      }
    );

    return {
      ok: true,
      data: {
        workspace: response.workspace,
      },
    };
  } catch (error) {
    return mapMutationError(
      "workspaceMutations.createWorkspace",
      error,
      function mapCreateError(pocketBaseError) {
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
      }
    );
  }
}

async function updateWorkspaceGeneral(
  workspaceSlug: string,
  input: UpdateWorkspaceGeneralInput
): Promise<ServerWorkspaceResponse<{ workspace: UserWorkspace; previousSlug: string }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { pb, membership, workspace } = workspaceAccess.context;
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

      updateData.slug = toWorkspaceSlug(normalizedSlugInput);
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

    const updatedWorkspace = await pb
      .collection("workspaces")
      .update<WorkspacesRecord>(workspace.id, updateData);

    return {
      ok: true,
      data: {
        workspace: mapUserWorkspaceSummary(pb, updatedWorkspace, membership),
        previousSlug: workspace.slug,
      },
    };
  } catch (error) {
    return mapMutationError(
      "workspaceMutations.updateWorkspaceGeneral",
      error,
      function mapError(pocketBaseError) {
        if (pocketBaseError.status === 400) {
          if (hasValidationCode(pocketBaseError.response?.data, "slug", "validation_not_unique")) {
            return "SLUG_NOT_AVAILABLE";
          }

          return "BAD_REQUEST";
        }

        if (pocketBaseError.status === 403 || pocketBaseError.status === 404) {
          return "FORBIDDEN";
        }

        return null;
      }
    );
  }
}

async function deleteWorkspace(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ deleted: true }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    await workspaceAccess.context.pb
      .collection("workspaces")
      .delete(workspaceAccess.context.workspace.id);

    return {
      ok: true,
      data: {
        deleted: true,
      },
    };
  } catch (error) {
    return mapMutationError(
      "workspaceMutations.deleteWorkspace",
      error,
      function mapError(pocketBaseError) {
        if (pocketBaseError.status === 403 || pocketBaseError.status === 404) {
          return "FORBIDDEN";
        }

        return null;
      }
    );
  }
}

async function leaveWorkspace(
  workspaceSlug: string
): Promise<ServerWorkspaceResponse<{ left: true }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    await workspaceAccess.context.pb
      .collection("workspace_members")
      .delete(workspaceAccess.context.membership.id);

    return {
      ok: true,
      data: {
        left: true,
      },
    };
  } catch (error) {
    return mapMutationError(
      "workspaceMutations.leaveWorkspace",
      error,
      function mapError(pocketBaseError) {
        if (isLastOwnerGuardError(pocketBaseError)) {
          return "LAST_OWNER_GUARD";
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
  }
}

async function changeMemberRole(
  workspaceSlug: string,
  memberId: string,
  role: WorkspaceMemberRole
): Promise<ServerWorkspaceResponse<{ updated: true }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { pb, workspace } = workspaceAccess.context;
    const memberRecord = await findWorkspaceMemberById(pb, workspace.id, memberId);

    if (!memberRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (memberRecord.role !== role) {
      await pb.collection("workspace_members").update(memberRecord.id, {
        role,
      });
    }

    return {
      ok: true,
      data: {
        updated: true,
      },
    };
  } catch (error) {
    return mapMutationError(
      "workspaceMutations.changeMemberRole",
      error,
      function mapError(pocketBaseError) {
        if (isLastOwnerGuardError(pocketBaseError)) {
          return "LAST_OWNER_GUARD";
        }

        if (pocketBaseError.status === 400) {
          return "BAD_REQUEST";
        }

        if (pocketBaseError.status === 403 || pocketBaseError.status === 404) {
          return "FORBIDDEN";
        }

        return null;
      }
    );
  }
}

async function removeMember(
  workspaceSlug: string,
  memberId: string
): Promise<ServerWorkspaceResponse<{ removed: true }>> {
  const workspaceAccess = await resolveWorkspaceActionAccess(workspaceSlug);

  if (!workspaceAccess.ok) {
    return workspaceAccess.response;
  }

  try {
    const { membership, pb, workspace } = workspaceAccess.context;
    const memberRecord = await findWorkspaceMemberById(pb, workspace.id, memberId);

    if (!memberRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (memberRecord.id === membership.id) {
      return {
        ok: false,
        errorCode: "FORBIDDEN",
      };
    }

    await pb.collection("workspace_members").delete(memberRecord.id);

    return {
      ok: true,
      data: {
        removed: true,
      },
    };
  } catch (error) {
    return mapMutationError(
      "workspaceMutations.removeMember",
      error,
      function mapError(pocketBaseError) {
        if (isLastOwnerGuardError(pocketBaseError)) {
          return "LAST_OWNER_GUARD";
        }

        if (pocketBaseError.status === 403 || pocketBaseError.status === 404) {
          return "FORBIDDEN";
        }

        return null;
      }
    );
  }
}

async function createInvite(
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
    return mapMutationError(
      "workspaceMutations.createInvite",
      error,
      function mapError(pocketBaseError) {
        if (pocketBaseError.status === 400) {
          return "BAD_REQUEST";
        }

        if (pocketBaseError.status === 403 || pocketBaseError.status === 404) {
          return "FORBIDDEN";
        }

        return null;
      }
    );
  }
}

async function resendInvite(
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
    return mapMutationError(
      "workspaceMutations.resendInvite",
      error,
      function mapError(pocketBaseError) {
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
  }
}

async function revokeInvite(
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
    return mapMutationError(
      "workspaceMutations.revokeInvite",
      error,
      function mapError(pocketBaseError) {
        if (pocketBaseError.status === 403) {
          return "FORBIDDEN";
        }

        if (pocketBaseError.status === 404) {
          return "NOT_FOUND";
        }

        return null;
      }
    );
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

async function safeDeleteRecord(
  pb: PocketBase,
  collectionName: string,
  recordId: string
): Promise<void> {
  try {
    await pb.collection(collectionName).delete(recordId);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return;
    }

    throw error;
  }
}

function mapMutationError<TData>(
  context: string,
  error: unknown,
  operationMapper: Parameters<typeof mapWorkspaceErrorCode>[1]
): ServerWorkspaceResponse<TData> {
  const errorCode = mapWorkspaceErrorCode(error, operationMapper);

  if (errorCode === "UNKNOWN_ERROR") {
    logWorkspaceServiceError(context, error);
  }

  return {
    ok: false,
    errorCode,
  };
}

function isLastOwnerGuardError(error: ClientResponseError): boolean {
  const responseData = error.response?.data;

  if (error.response?.message === "Workspace must have at least one owner.") {
    return true;
  }

  if (error.status !== 400 || responseData === null || typeof responseData !== "object") {
    return false;
  }

  return (
    ("guard" in responseData && responseData.guard === "LAST_OWNER_GUARD") ||
    ("code" in responseData && responseData.code === "LAST_OWNER_GUARD")
  );
}
