import { ClientResponseError } from "pocketbase";
import { logServiceError } from "@/server/pocketbase/pocketbase-utils";
import type {
  ServerOrganizationResponse,
  OrganizationErrorCode,
} from "@/server/organizations/organization-types";

type OrganizationStatusErrorMap = Partial<Record<number, OrganizationErrorCode>>;

export function mapOrganizationErrorCode(
  error: unknown,
  operationMapper: (error: ClientResponseError) => OrganizationErrorCode | null
): OrganizationErrorCode {
  if (error instanceof ClientResponseError) {
    if (error.status === 429) {
      return "RATE_LIMITED";
    }

    const mappedCode = operationMapper(error);

    if (mappedCode) {
      return mappedCode;
    }
  }

  return "UNKNOWN_ERROR";
}

export function logOrganizationServiceError(context: string, error: unknown): void {
  logServiceError("organizations", context, error);
}

export function createOrganizationErrorResponse<TData>(
  context: string,
  error: unknown,
  statusMap: OrganizationStatusErrorMap
): ServerOrganizationResponse<TData> {
  const errorCode = mapOrganizationErrorCode(
    error,
    (pocketBaseError) => statusMap[pocketBaseError.status] ?? null
  );

  if (errorCode === "UNKNOWN_ERROR") {
    logOrganizationServiceError(context, error);
  }

  return {
    ok: false,
    errorCode,
  };
}
