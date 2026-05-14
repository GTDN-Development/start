import PocketBase, { ClientResponseError } from "pocketbase";
import type {
  UsersRecord,
  OrganizationMembersRecord,
  OrganizationsRecord,
} from "@/types/pocketbase";
import type { AuthCookieMutations } from "@/server/auth/auth-cookies";
import { requireCurrentUser, requireCurrentWritableUser } from "@/server/auth/auth-session-service";
import { createOrganizationErrorResponse } from "@/server/organizations/organization-errors";
import { mapUserOrganizationSummary } from "@/server/organizations/organization-mappers";
import type {
  ServerOrganizationResponse,
  UserOrganization,
  OrganizationErrorCode,
} from "@/server/organizations/organization-types";

export type OrganizationAuthContext = {
  pb: PocketBase;
  user: UsersRecord;
};

export type OrganizationMembershipContext = OrganizationAuthContext & {
  membership: OrganizationMembersRecord;
  organization: OrganizationsRecord;
};

export type OrganizationRouteAccessContext = OrganizationAuthContext & {
  organization: UserOrganization;
};

type OrganizationMembershipContextResult =
  | {
      ok: true;
      context: OrganizationMembershipContext;
    }
  | {
      ok: false;
      response: ServerOrganizationResponse<never>;
    };

export async function resolveOrganizationRouteAccess(
  organizationSlug: string
): Promise<ServerOrganizationResponse<OrganizationRouteAccessContext>> {
  const organizationAccess = await resolveOrganizationMembership(
    organizationSlug,
    "read",
    "resolveOrganizationRouteAccess"
  );

  if (!organizationAccess.ok) {
    return organizationAccess.response;
  }

  const { pb, user, membership, organization } = organizationAccess.context;

  return {
    ok: true,
    data: {
      pb,
      user,
      organization: mapUserOrganizationSummary(pb, organization, membership),
    },
  };
}

export async function resolveWritableOrganizationAccess(
  organizationSlug: string
): Promise<OrganizationMembershipContextResult> {
  return resolveOrganizationMembership(
    organizationSlug,
    "write",
    "resolveWritableOrganizationAccess"
  );
}

export async function resolveAccessibleOrganizationForCurrentUser(
  organizationSlug: string
): Promise<ServerOrganizationResponse<{ organization: UserOrganization }>> {
  const organizationAccess = await resolveWritableOrganizationAccess(organizationSlug);

  if (!organizationAccess.ok) {
    return organizationAccess.response;
  }

  const { pb, membership, organization } = organizationAccess.context;

  return {
    ok: true,
    data: {
      organization: mapUserOrganizationSummary(pb, organization, membership),
    },
  };
}

async function resolveOrganizationMembership(
  organizationSlug: string,
  mode: "read" | "write",
  logContext: string
): Promise<OrganizationMembershipContextResult> {
  const currentUser =
    mode === "write" ? await requireCurrentWritableUser() : await requireCurrentUser();

  if (!currentUser.ok) {
    const cookieMutations =
      "cookieMutations" in currentUser
        ? (currentUser.cookieMutations as AuthCookieMutations)
        : undefined;

    return {
      ok: false,
      response: {
        ok: false,
        errorCode: currentUser.errorCode,
        ...(cookieMutations ? { cookieMutations } : {}),
      },
    };
  }

  try {
    const organization = await findOrganizationBySlug(currentUser.pb, organizationSlug);

    if (!organization) {
      return createOrganizationAccessFailure("NOT_FOUND");
    }

    const membership = await findOrganizationMembership(
      currentUser.pb,
      organization.id,
      currentUser.user.id
    );

    if (!membership) {
      return createOrganizationAccessFailure("FORBIDDEN");
    }

    return {
      ok: true,
      context: {
        pb: currentUser.pb,
        user: currentUser.user,
        organization,
        membership,
      },
    };
  } catch (error) {
    return {
      ok: false,
      response: createOrganizationErrorResponse(logContext, error, {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
      }),
    };
  }
}

async function findOrganizationBySlug(pb: PocketBase, organizationSlug: string) {
  return findFirstListItemOrNull<OrganizationsRecord>(
    pb,
    "organizations",
    pb.filter("slug = {:organizationSlug}", { organizationSlug })
  );
}

async function findOrganizationMembership(pb: PocketBase, organizationId: string, userId: string) {
  return findFirstListItemOrNull<OrganizationMembersRecord>(
    pb,
    "organization_members",
    pb.filter("organization = {:organizationId} && user = {:userId}", {
      organizationId,
      userId,
    })
  );
}

async function findFirstListItemOrNull<TRecord>(
  pb: PocketBase,
  collectionName: string,
  filter: string
): Promise<TRecord | null> {
  try {
    return await pb.collection(collectionName).getFirstListItem<TRecord>(filter);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

function createOrganizationAccessFailure(
  errorCode: OrganizationErrorCode
): OrganizationMembershipContextResult {
  return {
    ok: false,
    response: {
      ok: false,
      errorCode,
    },
  };
}
