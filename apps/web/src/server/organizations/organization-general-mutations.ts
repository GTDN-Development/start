import type { OrganizationsRecord } from "@/types/pocketbase";
import { toOrganizationSlug } from "@/features/organizations/organization-slug";
import { getNullableTrimmedString, hasValidationCode } from "@/server/pocketbase/pocketbase-utils";
import { requireCurrentWritableUser } from "@/server/auth/auth-session-service";
import { mapUserOrganizationSummary } from "@/server/organizations/organization-mappers";
import {
  isLastOwnerGuardError,
  mapMutationStatusError,
} from "@/server/organizations/organization-mutation-utils";
import { normalizeOrganizationName } from "@/server/organizations/organization-normalization";
import { resolveWritableOrganizationAccess } from "@/server/organizations/organization-route-queries";
import type {
  ServerOrganizationResponse,
  UserOrganization,
} from "@/server/organizations/organization-types";

export type CreateOrganizationInput = {
  name: string;
  slug?: string | null;
};

export type UpdateOrganizationGeneralInput = {
  name?: string | null;
  slug?: string | null;
  avatarFile?: File | null;
  removeAvatar?: boolean;
};

export async function createOrganization(
  input: CreateOrganizationInput
): Promise<ServerOrganizationResponse<{ organization: UserOrganization }>> {
  const currentUser = await requireCurrentWritableUser();

  if (!currentUser.ok) {
    return {
      ok: false,
      errorCode: currentUser.errorCode,
      ...(currentUser.cookieMutations ? { cookieMutations: currentUser.cookieMutations } : {}),
    };
  }

  try {
    const response = await currentUser.pb.send<{ organization: UserOrganization }>(
      "/api/web/organizations",
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
        organization: response.organization,
      },
    };
  } catch (error) {
    return mapMutationStatusError("createOrganization", error, {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
    });
  }
}

export async function updateOrganizationGeneral(
  organizationSlug: string,
  input: UpdateOrganizationGeneralInput
): Promise<ServerOrganizationResponse<{ organization: UserOrganization; previousSlug: string }>> {
  const organizationAccess = await resolveWritableOrganizationAccess(organizationSlug);

  if (!organizationAccess.ok) {
    return organizationAccess.response;
  }

  try {
    const { pb, membership, organization } = organizationAccess.context;
    const updateData: Record<string, string | File | null> = {};

    if (input.name !== undefined) {
      const normalizedName = normalizeOrganizationName(input.name ?? "");

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

      updateData.slug = toOrganizationSlug(normalizedSlugInput);
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

    const updatedOrganization = await pb
      .collection("organizations")
      .update<OrganizationsRecord>(organization.id, updateData);

    return {
      ok: true,
      data: {
        organization: mapUserOrganizationSummary(pb, updatedOrganization, membership),
        previousSlug: organization.slug,
      },
    };
  } catch (error) {
    return mapMutationStatusError(
      "updateOrganizationGeneral",
      error,
      { 400: "BAD_REQUEST", 403: "FORBIDDEN", 404: "FORBIDDEN" },
      (pocketBaseError) => {
        return hasValidationCode(pocketBaseError.response?.data, "slug", "validation_not_unique")
          ? "SLUG_NOT_AVAILABLE"
          : null;
      }
    );
  }
}

export async function deleteOrganization(
  organizationSlug: string
): Promise<ServerOrganizationResponse<{ deleted: true; organizationId: string }>> {
  const organizationAccess = await resolveWritableOrganizationAccess(organizationSlug);

  if (!organizationAccess.ok) {
    return organizationAccess.response;
  }

  try {
    await organizationAccess.context.pb
      .collection("organizations")
      .delete(organizationAccess.context.organization.id);

    return {
      ok: true,
      data: {
        deleted: true,
        organizationId: organizationAccess.context.organization.id,
      },
    };
  } catch (error) {
    return mapMutationStatusError("deleteOrganization", error, {
      403: "FORBIDDEN",
      404: "FORBIDDEN",
    });
  }
}

export async function leaveOrganization(
  organizationSlug: string
): Promise<ServerOrganizationResponse<{ left: true; organizationId: string }>> {
  const organizationAccess = await resolveWritableOrganizationAccess(organizationSlug);

  if (!organizationAccess.ok) {
    return organizationAccess.response;
  }

  try {
    await organizationAccess.context.pb
      .collection("organization_members")
      .delete(organizationAccess.context.membership.id);

    return {
      ok: true,
      data: {
        left: true,
        organizationId: organizationAccess.context.organization.id,
      },
    };
  } catch (error) {
    return mapMutationStatusError(
      "leaveOrganization",
      error,
      { 403: "FORBIDDEN", 404: "NOT_FOUND" },
      (pocketBaseError) => (isLastOwnerGuardError(pocketBaseError) ? "LAST_OWNER_GUARD" : null)
    );
  }
}
