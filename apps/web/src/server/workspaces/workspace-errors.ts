import { ClientResponseError } from "pocketbase";
import { logServiceError } from "@/server/pocketbase/pocketbase-utils";
import type {
  ServerWorkspaceResponse,
  WorkspaceErrorCode,
} from "@/server/workspaces/workspace-types";

type WorkspaceStatusErrorMap = Partial<Record<number, WorkspaceErrorCode>>;

export function mapWorkspaceErrorCode(
  error: unknown,
  operationMapper: (error: ClientResponseError) => WorkspaceErrorCode | null
): WorkspaceErrorCode {
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

export function logWorkspaceServiceError(context: string, error: unknown): void {
  logServiceError("workspaces", context, error);
}

export function createWorkspaceErrorResponse<TData>(
  context: string,
  error: unknown,
  statusMap: WorkspaceStatusErrorMap
): ServerWorkspaceResponse<TData> {
  const errorCode = mapWorkspaceErrorCode(
    error,
    (pocketBaseError) => statusMap[pocketBaseError.status] ?? null
  );

  if (errorCode === "UNKNOWN_ERROR") {
    logWorkspaceServiceError(context, error);
  }

  return {
    ok: false,
    errorCode,
  };
}
