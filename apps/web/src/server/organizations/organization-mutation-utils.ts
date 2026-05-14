import type PocketBase from "pocketbase";
import { ClientResponseError } from "pocketbase";
import type { OrganizationInvitesRecord, OrganizationMembersRecord } from "@/types/pocketbase";
import {
  mapOrganizationErrorCode,
  logOrganizationServiceError,
} from "@/server/organizations/organization-errors";
import type {
  ServerOrganizationResponse,
  OrganizationErrorCode,
} from "@/server/organizations/organization-types";

type OrganizationOperationErrorMapper = (
  error: ClientResponseError
) => OrganizationErrorCode | null;
type OrganizationStatusErrorMap = Partial<Record<number, OrganizationErrorCode>>;

export async function findOrganizationMemberById(
  pb: PocketBase,
  organizationId: string,
  memberId: string
): Promise<OrganizationMembersRecord | null> {
  try {
    return await pb.collection("organization_members").getFirstListItem<OrganizationMembersRecord>(
      pb.filter("id = {:memberId} && organization = {:organizationId}", {
        memberId,
        organizationId,
      })
    );
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function findInviteById(
  pb: PocketBase,
  organizationId: string,
  inviteId: string
): Promise<OrganizationInvitesRecord | null> {
  try {
    return await pb.collection("organization_invites").getFirstListItem<OrganizationInvitesRecord>(
      pb.filter("id = {:inviteId} && organization = {:organizationId}", {
        inviteId,
        organizationId,
      })
    );
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function findInviteByEmail(
  pb: PocketBase,
  organizationId: string,
  emailNormalized: string
): Promise<OrganizationInvitesRecord | null> {
  try {
    return await pb.collection("organization_invites").getFirstListItem<OrganizationInvitesRecord>(
      pb.filter("organization = {:organizationId} && email_normalized = {:emailNormalized}", {
        organizationId,
        emailNormalized,
      })
    );
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function safeDeleteRecord(
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

export function mapMutationError<TData>(
  context: string,
  error: unknown,
  operationMapper: OrganizationOperationErrorMapper
): ServerOrganizationResponse<TData> {
  const errorCode = mapOrganizationErrorCode(error, operationMapper);

  if (errorCode === "UNKNOWN_ERROR") {
    logOrganizationServiceError(context, error);
  }

  return {
    ok: false,
    errorCode,
  };
}

export function mapMutationStatusError<TData>(
  context: string,
  error: unknown,
  statusMap: OrganizationStatusErrorMap,
  operationMapper?: OrganizationOperationErrorMapper
): ServerOrganizationResponse<TData> {
  return mapMutationError(
    context,
    error,
    (pocketBaseError) =>
      operationMapper?.(pocketBaseError) ?? statusMap[pocketBaseError.status] ?? null
  );
}

export function isLastOwnerGuardError(error: ClientResponseError): boolean {
  const responseData = error.response?.data;

  if (error.response?.message === "Organization must have at least one owner.") {
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
