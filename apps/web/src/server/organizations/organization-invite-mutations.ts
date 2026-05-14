import type { OrganizationInvitesRecord } from "@/types/pocketbase";
import type { AppLocale } from "@/i18n/routing";
import { organizationConfig } from "@/config/organization";
import { getNullableTrimmedString } from "@/server/pocketbase/pocketbase-utils";
import { sendOrganizationInviteEmail } from "@/server/organizations/organization-invite-mailer";
import {
  createInviteExpiryDate,
  createInviteToken,
  hashInviteToken,
  isDateStringExpired,
} from "@/server/organizations/organization-invite-utils";
import {
  findInviteByEmail,
  findInviteById,
  mapMutationStatusError,
  safeDeleteRecord,
} from "@/server/organizations/organization-mutation-utils";
import { normalizeEmail } from "@/server/organizations/organization-normalization";
import { resolveWritableOrganizationAccess } from "@/server/organizations/organization-route-queries";
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
  const organizationAccess = await resolveWritableOrganizationAccess(organizationSlug);
  const normalizedEmail = normalizeEmail(input.email);

  if (!organizationAccess.ok) {
    return organizationAccess.response;
  }

  if (!normalizedEmail) {
    return {
      ok: false,
      errorCode: "BAD_REQUEST",
    };
  }

  try {
    const { pb, user, organization } = organizationAccess.context;
    const existingInvite = await findInviteByEmail(pb, organization.id, normalizedEmail);

    if (existingInvite) {
      if (!isDateStringExpired(existingInvite.expires_at)) {
        return {
          ok: false,
          errorCode: "BAD_REQUEST",
        };
      }

      await safeDeleteRecord(pb, "organization_invites", existingInvite.id);
    }

    const inviteToken = createInviteToken();
    const inviteRecord = await pb
      .collection("organization_invites")
      .create<OrganizationInvitesRecord>({
        organization: organization.id,
        email_normalized: normalizedEmail,
        role: input.role,
        token_hash: hashInviteToken(inviteToken),
        expires_at: createInviteExpiryDate(),
        invited_by: user.id,
      });

    await sendOrganizationInviteEmail({
      locale: input.locale,
      email: normalizedEmail,
      organizationName: organization.name,
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
  organizationSlug: string,
  inviteId: string,
  locale: AppLocale
): Promise<ServerOrganizationResponse<{ inviteId: string; expiresAt: string; updatedAt: string }>> {
  const organizationAccess = await resolveWritableOrganizationAccess(organizationSlug);

  if (!organizationAccess.ok) {
    return organizationAccess.response;
  }

  try {
    const { pb, user, organization } = organizationAccess.context;
    const inviteRecord = await findInviteById(pb, organization.id, inviteId);

    if (!inviteRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (isDateStringExpired(inviteRecord.expires_at)) {
      await safeDeleteRecord(pb, "organization_invites", inviteRecord.id);

      return {
        ok: false,
        errorCode: "INVITE_INVALID_OR_EXPIRED",
      };
    }

    const inviteLastUpdatedAt = Date.parse(inviteRecord.updated);

    if (
      Number.isFinite(inviteLastUpdatedAt) &&
      Date.now() - inviteLastUpdatedAt < organizationConfig.invites.resendCooldownSeconds * 1000
    ) {
      return {
        ok: false,
        errorCode: "RATE_LIMITED",
      };
    }

    const nextInviteToken = createInviteToken();
    const updatedInviteRecord = await pb
      .collection("organization_invites")
      .update<OrganizationInvitesRecord>(inviteRecord.id, {
        token_hash: hashInviteToken(nextInviteToken),
        expires_at: createInviteExpiryDate(),
      });

    await sendOrganizationInviteEmail({
      locale,
      email: inviteRecord.email_normalized,
      organizationName: organization.name,
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
  organizationSlug: string,
  inviteId: string
): Promise<ServerOrganizationResponse<{ revoked: true }>> {
  const organizationAccess = await resolveWritableOrganizationAccess(organizationSlug);

  if (!organizationAccess.ok) {
    return organizationAccess.response;
  }

  try {
    const { pb, organization } = organizationAccess.context;
    const inviteRecord = await findInviteById(pb, organization.id, inviteId);

    if (!inviteRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    await pb.collection("organization_invites").delete(inviteRecord.id);

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
