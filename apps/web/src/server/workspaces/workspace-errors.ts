import { ClientResponseError } from "pocketbase";
import { logServiceError } from "@/server/pocketbase/pocketbase-utils";
import type { WorkspaceErrorCode } from "@/server/workspaces/workspace-types";

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
