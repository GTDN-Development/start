import type PocketBase from "pocketbase";
import { createOrganizationErrorResponse } from "@/server/organizations/organization-errors";
import {
  mapOrganizationInviteSummary,
  mapOrganizationMemberSummary,
  sortOrganizationMembers,
  type OrganizationInviteRecordWithExpand,
  type OrganizationMemberRecordWithExpand,
} from "@/server/organizations/organization-mappers";
import { isDateStringExpired } from "@/server/organizations/organization-invite-utils";
import type {
  ServerOrganizationResponse,
  OrganizationInviteSummary,
  OrganizationMemberSummary,
} from "@/server/organizations/organization-types";

export async function listOrganizationMembersForSettings(
  pb: PocketBase,
  organizationId: string
): Promise<ServerOrganizationResponse<{ members: OrganizationMemberSummary[] }>> {
  try {
    const memberRecords = await pb
      .collection("organization_members")
      .getFullList<OrganizationMemberRecordWithExpand>({
        filter: pb.filter("organization = {:organizationId}", { organizationId }),
        expand: "user",
        sort: "-created",
      });
    const members = memberRecords
      .map((memberRecord) => mapOrganizationMemberSummary(pb, memberRecord))
      .filter((value): value is OrganizationMemberSummary => value !== null)
      .sort(sortOrganizationMembers);

    return {
      ok: true,
      data: {
        members,
      },
    };
  } catch (error) {
    return mapSettingsQueryError("listOrganizationMembersForSettings", error);
  }
}

export async function listOrganizationInvitesForSettings(
  pb: PocketBase,
  organizationId: string
): Promise<ServerOrganizationResponse<{ invites: OrganizationInviteSummary[] }>> {
  try {
    const inviteRecords = await pb
      .collection("organization_invites")
      .getFullList<OrganizationInviteRecordWithExpand>({
        filter: pb.filter("organization = {:organizationId}", { organizationId }),
        expand: "invited_by",
        sort: "-created",
      });
    const now = Date.now();
    const invites = inviteRecords
      .filter((inviteRecord) => !isDateStringExpired(inviteRecord.expires_at, now))
      .map((inviteRecord) => mapOrganizationInviteSummary(inviteRecord));

    return {
      ok: true,
      data: {
        invites,
      },
    };
  } catch (error) {
    return mapSettingsQueryError("listOrganizationInvitesForSettings", error);
  }
}

function mapSettingsQueryError<TData>(
  context: string,
  error: unknown
): ServerOrganizationResponse<TData> {
  return createOrganizationErrorResponse(context, error, {
    403: "FORBIDDEN",
    404: "NOT_FOUND",
  });
}
