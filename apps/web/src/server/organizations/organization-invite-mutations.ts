import type { AppLocale } from "@/i18n/routing";
import { requireCurrentWritableUser } from "@/server/auth/auth-session-service";
import { withInternalPocketBaseHeaders } from "@/server/pocketbase/pocketbase-internal";
import { mapMutationStatusError } from "@/server/organizations/organization-mutation-utils";
import type {
  ServerOrganizationResponse,
  OrganizationInviteRole,
  OrganizationInviteSummary,
} from "@/server/organizations/organization-types";

export type CreateOrganizationInviteInput = {
  locale: AppLocale;
  email: string;
  role: OrganizationInviteRole;
};

export async function createInvite(
  organizationSlug: string,
  input: CreateOrganizationInviteInput
): Promise<ServerOrganizationResponse<{ invite: OrganizationInviteSummary }>> {
  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.cookieMutations ? { cookieMutations: currentUser.cookieMutations } : {}),
    };
  }

  try {
    const response = await currentUser.pb.send<{ invite: OrganizationInviteSummary }>(
      "/api/web/organization-invites/create",
      withInternalPocketBaseHeaders({
        method: "POST",
        body: {
          organizationSlug,
          email: input.email,
          role: input.role,
        },
      })
    );

    return {
      ok: true,
      data: {
        invite: response.invite,
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
  organizationSlug: string,
  inviteId: string,
  locale: AppLocale
): Promise<ServerOrganizationResponse<{ inviteId: string; expiresAt: string; updatedAt: string }>> {
  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.cookieMutations ? { cookieMutations: currentUser.cookieMutations } : {}),
    };
  }

  try {
    void locale;
    const response = await currentUser.pb.send<{
      inviteId: string;
      expiresAt: string;
      updatedAt: string;
    }>(
      "/api/web/organization-invites/resend",
      withInternalPocketBaseHeaders({
        method: "POST",
        body: {
          organizationSlug,
          inviteId,
        },
      })
    );

    return {
      ok: true,
      data: {
        inviteId: response.inviteId,
        expiresAt: response.expiresAt,
        updatedAt: response.updatedAt,
      },
    };
  } catch (error) {
    return mapMutationStatusError(
      "resendInvite",
      error,
      {
        400: "BAD_REQUEST",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
      },
      function mapInviteResendOperationError(pocketBaseError) {
        return pocketBaseError.response?.message === "Organization invite is invalid or expired."
          ? "INVITE_INVALID_OR_EXPIRED"
          : null;
      }
    );
  }
}

export async function revokeInvite(
  organizationSlug: string,
  inviteId: string
): Promise<ServerOrganizationResponse<{ revoked: true }>> {
  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.cookieMutations ? { cookieMutations: currentUser.cookieMutations } : {}),
    };
  }

  try {
    await currentUser.pb.send(
      "/api/web/organization-invites/revoke",
      withInternalPocketBaseHeaders({
        method: "POST",
        body: {
          organizationSlug,
          inviteId,
        },
      })
    );

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
