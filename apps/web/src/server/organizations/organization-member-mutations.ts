import {
  findOrganizationMemberById,
  isLastOwnerGuardError,
  mapMutationStatusError,
} from "@/server/organizations/organization-mutation-utils";
import { resolveOrganizationActionAccess } from "@/server/organizations/organization-route-queries";
import type {
  ServerOrganizationResponse,
  OrganizationMemberRole,
} from "@/server/organizations/organization-types";

export async function changeMemberRole(
  organizationSlug: string,
  memberId: string,
  role: OrganizationMemberRole
): Promise<ServerOrganizationResponse<{ updated: true }>> {
  const organizationAccess = await resolveOrganizationActionAccess(organizationSlug);

  if (!organizationAccess.ok) {
    return organizationAccess.response;
  }

  try {
    const { pb, organization } = organizationAccess.context;
    const memberRecord = await findOrganizationMemberById(pb, organization.id, memberId);

    if (!memberRecord) {
      return {
        ok: false,
        errorCode: "NOT_FOUND",
      };
    }

    if (memberRecord.role !== role) {
      await pb.collection("organization_members").update(memberRecord.id, {
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
    return mapMutationStatusError(
      "changeMemberRole",
      error,
      { 400: "BAD_REQUEST", 403: "FORBIDDEN", 404: "FORBIDDEN" },
      (pocketBaseError) => (isLastOwnerGuardError(pocketBaseError) ? "LAST_OWNER_GUARD" : null)
    );
  }
}

export async function removeMember(
  organizationSlug: string,
  memberId: string
): Promise<ServerOrganizationResponse<{ removed: true }>> {
  const organizationAccess = await resolveOrganizationActionAccess(organizationSlug);

  if (!organizationAccess.ok) {
    return organizationAccess.response;
  }

  try {
    const { membership, pb, organization } = organizationAccess.context;
    const memberRecord = await findOrganizationMemberById(pb, organization.id, memberId);

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

    await pb.collection("organization_members").delete(memberRecord.id);

    return {
      ok: true,
      data: {
        removed: true,
      },
    };
  } catch (error) {
    return mapMutationStatusError(
      "removeMember",
      error,
      { 403: "FORBIDDEN", 404: "FORBIDDEN" },
      (pocketBaseError) => (isLastOwnerGuardError(pocketBaseError) ? "LAST_OWNER_GUARD" : null)
    );
  }
}
