import type PocketBase from "pocketbase";
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
import {
  mapWorkspaceInviteSummary,
  mapWorkspaceMemberSummary,
  sortWorkspaceMembers,
  type WorkspaceInviteRecordWithExpand,
  type WorkspaceMemberRecordWithExpand,
} from "@/server/workspaces/workspace-mappers";
import { isDateStringExpired } from "@/server/workspaces/workspace-invite-utils";
import type {
  ServerWorkspaceResponse,
  WorkspaceInviteSummary,
  WorkspaceMemberSummary,
} from "@/server/workspaces/workspace-types";

export async function listWorkspaceMembersForSettings(
  pb: PocketBase,
  workspaceId: string
): Promise<ServerWorkspaceResponse<{ members: WorkspaceMemberSummary[] }>> {
  try {
    const memberRecords = await pb
      .collection("workspace_members")
      .getFullList<WorkspaceMemberRecordWithExpand>({
        filter: pb.filter("workspace = {:workspaceId}", { workspaceId }),
        expand: "user",
        sort: "-created",
      });
    const members = memberRecords
      .map((memberRecord) => mapWorkspaceMemberSummary(pb, memberRecord))
      .filter((value): value is WorkspaceMemberSummary => value !== null)
      .sort(sortWorkspaceMembers);

    return {
      ok: true,
      data: {
        members,
      },
    };
  } catch (error) {
    return mapSettingsQueryError("listWorkspaceMembersForSettings", error);
  }
}

export async function listWorkspaceInvitesForSettings(
  pb: PocketBase,
  workspaceId: string
): Promise<ServerWorkspaceResponse<{ invites: WorkspaceInviteSummary[] }>> {
  try {
    const inviteRecords = await pb
      .collection("workspace_invites")
      .getFullList<WorkspaceInviteRecordWithExpand>({
        filter: pb.filter("workspace = {:workspaceId}", { workspaceId }),
        expand: "invited_by",
        sort: "-created",
      });
    const now = Date.now();
    const invites = inviteRecords
      .filter((inviteRecord) => !isDateStringExpired(inviteRecord.expires_at, now))
      .map((inviteRecord) => mapWorkspaceInviteSummary(inviteRecord));

    return {
      ok: true,
      data: {
        invites,
      },
    };
  } catch (error) {
    return mapSettingsQueryError("listWorkspaceInvitesForSettings", error);
  }
}

function mapSettingsQueryError<TData>(
  context: string,
  error: unknown
): ServerWorkspaceResponse<TData> {
  const errorCode = mapWorkspaceErrorCode(
    error,
    function mapSettingsQueryErrorCode(pocketBaseError) {
      if (pocketBaseError.status === 404) {
        return "NOT_FOUND";
      }

      if (pocketBaseError.status === 403) {
        return "FORBIDDEN";
      }

      return null;
    }
  );

  if (errorCode === "UNKNOWN_ERROR") {
    logWorkspaceServiceError(context, error);
  }

  return {
    ok: false,
    errorCode,
  };
}
