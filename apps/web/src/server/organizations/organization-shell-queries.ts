import type PocketBase from "pocketbase";
import type { OrganizationMembersRecord, OrganizationsRecord } from "@/types/pocketbase";
import { getInviteHref } from "@/config/routes";
import type { AppHref } from "@/i18n/navigation";
import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import {
  getActiveOrganizationSlugCookie,
  getPendingInviteTokenCookie,
} from "@/server/organizations/organization-cookie";
import {
  mapUserOrganizationSummary,
  sortUserOrganizations,
  type OrganizationMemberRecordWithExpand,
} from "@/server/organizations/organization-mappers";
import { createOrganizationErrorResponse } from "@/server/organizations/organization-errors";
import type {
  PostAuthDestination,
  ServerOrganizationResponse,
  UserOrganization,
} from "@/server/organizations/organization-types";

export async function listUserOrganizationShells(
  pb: PocketBase,
  userId: string
): Promise<ServerOrganizationResponse<{ organizations: UserOrganization[] }>> {
  try {
    const membershipRecords = await pb
      .collection("organization_members")
      .getFullList<OrganizationMemberRecordWithExpand>({
        filter: pb.filter("user = {:userId}", { userId }),
        expand: "organization",
        sort: "-created",
      });
    const organizations = membershipRecords
      .map(function mapMembershipRecord(membershipRecord) {
        const organization = membershipRecord.expand?.organization;

        return organization ? mapUserOrganizationSummary(pb, organization, membershipRecord) : null;
      })
      .filter((organization): organization is UserOrganization => organization !== null)
      .sort(sortUserOrganizations);

    return {
      ok: true,
      data: {
        organizations,
      },
    };
  } catch (error) {
    return createOrganizationErrorResponse("listUserOrganizationShells", error, {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
    });
  }
}

export async function resolvePostAuthDestinationForUser({
  userId,
}: {
  userId: string;
}): Promise<ServerOrganizationResponse<PostAuthDestination>> {
  const pendingInviteToken = await getPendingInviteTokenCookie();

  if (pendingInviteToken) {
    return {
      ok: true,
      data: {
        state: "invite_redirect",
        inviteToken: pendingInviteToken,
      },
    };
  }

  const activeOrganizationResponse = await resolveActiveOrganizationSlugForUser(userId);

  if (!activeOrganizationResponse.ok) {
    return activeOrganizationResponse;
  }

  if (activeOrganizationResponse.data.organizationSlug) {
    return {
      ok: true,
      data: {
        state: "organization_redirect",
        organizationSlug: activeOrganizationResponse.data.organizationSlug,
      },
    };
  }

  return {
    ok: true,
    data: {
      state: "app",
    },
  };
}

export async function resolveActiveOrganizationSlugForUser(
  userId: string
): Promise<ServerOrganizationResponse<{ organizationSlug: string | null }>> {
  const { pb } = await createPocketBaseServerClient();
  const activeOrganizationSlug = await getActiveOrganizationSlugCookie();

  if (!activeOrganizationSlug) {
    return {
      ok: true,
      data: {
        organizationSlug: null,
      },
    };
  }

  try {
    const organization = await pb
      .collection("organizations")
      .getFirstListItem<OrganizationsRecord>(
        pb.filter("slug = {:activeOrganizationSlug}", { activeOrganizationSlug })
      );
    const membership = await pb
      .collection("organization_members")
      .getFirstListItem<OrganizationMembersRecord>(
        pb.filter("organization = {:organizationId} && user = {:userId}", {
          organizationId: organization.id,
          userId,
        })
      );

    return {
      ok: true,
      data: {
        organizationSlug: membership ? organization.slug : null,
      },
    };
  } catch (error) {
    const response = createOrganizationErrorResponse<{ organizationSlug: string | null }>(
      "resolveActiveOrganizationSlugForUser",
      error,
      {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
      }
    );

    if (
      !response.ok &&
      (response.errorCode === "NOT_FOUND" || response.errorCode === "FORBIDDEN")
    ) {
      return {
        ok: true,
        data: {
          organizationSlug: null,
        },
      };
    }

    return response;
  }
}

export function getInviteDestinationHref(inviteToken: string): AppHref {
  return getInviteHref(inviteToken);
}
