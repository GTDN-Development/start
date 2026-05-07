import type PocketBase from "pocketbase";
import { ClientResponseError } from "pocketbase";
import type { WorkspaceInvitesRecord, WorkspaceMembersRecord } from "@/types/pocketbase";
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
import type {
  ServerWorkspaceResponse,
  WorkspaceErrorCode,
} from "@/server/workspaces/workspace-types";

type WorkspaceOperationErrorMapper = (error: ClientResponseError) => WorkspaceErrorCode | null;
type WorkspaceStatusErrorMap = Partial<Record<number, WorkspaceErrorCode>>;

export async function findWorkspaceMemberById(
  pb: PocketBase,
  workspaceId: string,
  memberId: string
): Promise<WorkspaceMembersRecord | null> {
  try {
    return await pb.collection("workspace_members").getFirstListItem<WorkspaceMembersRecord>(
      pb.filter("id = {:memberId} && workspace = {:workspaceId}", {
        memberId,
        workspaceId,
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
  workspaceId: string,
  inviteId: string
): Promise<WorkspaceInvitesRecord | null> {
  try {
    return await pb.collection("workspace_invites").getFirstListItem<WorkspaceInvitesRecord>(
      pb.filter("id = {:inviteId} && workspace = {:workspaceId}", {
        inviteId,
        workspaceId,
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
  operationMapper: WorkspaceOperationErrorMapper
): ServerWorkspaceResponse<TData> {
  const errorCode = mapWorkspaceErrorCode(error, operationMapper);

  if (errorCode === "UNKNOWN_ERROR") {
    logWorkspaceServiceError(context, error);
  }

  return {
    ok: false,
    errorCode,
  };
}

export function mapMutationStatusError<TData>(
  context: string,
  error: unknown,
  statusMap: WorkspaceStatusErrorMap,
  operationMapper?: WorkspaceOperationErrorMapper
): ServerWorkspaceResponse<TData> {
  return mapMutationError(
    context,
    error,
    (pocketBaseError) =>
      operationMapper?.(pocketBaseError) ?? statusMap[pocketBaseError.status] ?? null
  );
}

export function isLastOwnerGuardError(error: ClientResponseError): boolean {
  const responseData = error.response?.data;

  if (error.response?.message === "Workspace must have at least one owner.") {
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
