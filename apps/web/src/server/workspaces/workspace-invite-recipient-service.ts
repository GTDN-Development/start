import {
  createPocketBaseClient,
  createPocketBaseServerClient,
} from "@/server/pocketbase/pocketbase-server";
import { createWorkspaceErrorResponse } from "@/server/workspaces/workspace-errors";
import type {
  ServerWorkspaceResponse,
  WorkspaceInviteAcceptResult,
  WorkspaceInviteInspectResult,
} from "@/server/workspaces/workspace-types";

type PocketBaseGuestInviteInspectResult = {
  state: "invalid_or_expired" | "valid_guest";
};

export async function validateInviteToken(
  inviteToken: string
): Promise<ServerWorkspaceResponse<{ isValid: boolean }>> {
  try {
    const pb = createPocketBaseClient();
    const result = await pb.send<PocketBaseGuestInviteInspectResult>(
      "/api/start/workspace-invites/inspect",
      {
        method: "POST",
        body: {
          token: inviteToken,
        },
      }
    );

    return {
      ok: true,
      data: {
        isValid: result.state === "valid_guest",
      },
    };
  } catch (error) {
    return mapInviteRecipientError("validateInviteToken", error);
  }
}

export async function getInviteTokenForUser(
  inviteToken: string
): Promise<ServerWorkspaceResponse<{ result: WorkspaceInviteInspectResult }>> {
  try {
    const { pb } = await createPocketBaseServerClient();
    const result = await pb.send<WorkspaceInviteInspectResult>(
      "/api/start/workspace-invites/inspect",
      {
        method: "POST",
        body: {
          token: inviteToken,
        },
      }
    );

    return {
      ok: true,
      data: {
        result,
      },
    };
  } catch (error) {
    return mapInviteRecipientError("getInviteTokenForUser", error);
  }
}

export async function acceptInviteTokenForUser(
  inviteToken: string
): Promise<ServerWorkspaceResponse<{ result: WorkspaceInviteAcceptResult }>> {
  try {
    const { pb } = await createPocketBaseServerClient();
    const result = await pb.send<WorkspaceInviteAcceptResult>(
      "/api/start/workspace-invites/accept",
      {
        method: "POST",
        body: {
          token: inviteToken,
        },
      }
    );

    return {
      ok: true,
      data: {
        result,
      },
    };
  } catch (error) {
    return mapInviteRecipientError("acceptInviteTokenForUser", error);
  }
}

function mapInviteRecipientError<TData>(
  context: string,
  error: unknown
): ServerWorkspaceResponse<TData> {
  return createWorkspaceErrorResponse(context, error, {
    400: "INVITE_INVALID_OR_EXPIRED",
    401: "UNAUTHORIZED",
    403: "FORBIDDEN",
    404: "INVITE_INVALID_OR_EXPIRED",
  });
}
