import type PocketBase from "pocketbase";
import type { WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";
import { getInviteHref } from "@/config/routes";
import type { AppHref } from "@/i18n/navigation";
import { createPocketBaseServerClient } from "@/server/pocketbase/pocketbase-server";
import {
  getActiveWorkspaceSlugCookie,
  getPendingInviteTokenCookie,
} from "@/server/workspaces/workspace-cookie";
import {
  mapUserWorkspaceSummary,
  sortUserWorkspaces,
  type WorkspaceMemberRecordWithExpand,
} from "@/server/workspaces/workspace-mappers";
import { createWorkspaceErrorResponse } from "@/server/workspaces/workspace-errors";
import type {
  PostAuthDestination,
  ServerWorkspaceResponse,
  UserWorkspace,
} from "@/server/workspaces/workspace-types";

export async function listUserWorkspaceShells(
  pb: PocketBase,
  userId: string
): Promise<ServerWorkspaceResponse<{ workspaces: UserWorkspace[] }>> {
  try {
    const membershipRecords = await pb
      .collection("workspace_members")
      .getFullList<WorkspaceMemberRecordWithExpand>({
        filter: pb.filter("user = {:userId}", { userId }),
        expand: "workspace",
        sort: "-created",
      });
    const workspaces = membershipRecords
      .map(function mapMembershipRecord(membershipRecord) {
        const workspace = membershipRecord.expand?.workspace;

        return workspace ? mapUserWorkspaceSummary(pb, workspace, membershipRecord) : null;
      })
      .filter((workspace): workspace is UserWorkspace => workspace !== null)
      .sort(sortUserWorkspaces);

    return {
      ok: true,
      data: {
        workspaces,
      },
    };
  } catch (error) {
    return createWorkspaceErrorResponse("listUserWorkspaceShells", error, {
      400: "BAD_REQUEST",
      401: "UNAUTHORIZED",
      403: "FORBIDDEN",
    });
  }
}

export async function resolvePostAuthDestinationForUser({
  userId,
}: {
  userId: string;
}): Promise<ServerWorkspaceResponse<PostAuthDestination>> {
  const pendingInviteToken = await getPendingInviteTokenCookie();

  if (pendingInviteToken) {
    return {
      ok: true,
      data: {
        state: "invite_redirect",
        inviteToken: pendingInviteToken,
      },
    };
  }

  const activeWorkspaceResponse = await resolveActiveWorkspaceSlugForUser(userId);

  if (!activeWorkspaceResponse.ok) {
    return activeWorkspaceResponse;
  }

  if (activeWorkspaceResponse.data.workspaceSlug) {
    return {
      ok: true,
      data: {
        state: "workspace_redirect",
        workspaceSlug: activeWorkspaceResponse.data.workspaceSlug,
      },
    };
  }

  return {
    ok: true,
    data: {
      state: "app",
    },
  };
}

export async function resolveActiveWorkspaceSlugForUser(
  userId: string
): Promise<ServerWorkspaceResponse<{ workspaceSlug: string | null }>> {
  const { pb } = await createPocketBaseServerClient();
  const activeWorkspaceSlug = await getActiveWorkspaceSlugCookie();

  if (!activeWorkspaceSlug) {
    return {
      ok: true,
      data: {
        workspaceSlug: null,
      },
    };
  }

  try {
    const workspace = await pb
      .collection("workspaces")
      .getFirstListItem<WorkspacesRecord>(
        pb.filter("slug = {:activeWorkspaceSlug}", { activeWorkspaceSlug })
      );
    const membership = await pb
      .collection("workspace_members")
      .getFirstListItem<WorkspaceMembersRecord>(
        pb.filter("workspace = {:workspaceId} && user = {:userId}", {
          workspaceId: workspace.id,
          userId,
        })
      );

    return {
      ok: true,
      data: {
        workspaceSlug: membership ? workspace.slug : null,
      },
    };
  } catch (error) {
    const response = createWorkspaceErrorResponse<{ workspaceSlug: string | null }>(
      "resolveActiveWorkspaceSlugForUser",
      error,
      {
        400: "BAD_REQUEST",
        401: "UNAUTHORIZED",
        403: "FORBIDDEN",
        404: "NOT_FOUND",
      }
    );

    if (
      !response.ok &&
      (response.errorCode === "NOT_FOUND" || response.errorCode === "FORBIDDEN")
    ) {
      return {
        ok: true,
        data: {
          workspaceSlug: null,
        },
      };
    }

    return response;
  }
}

export function getInviteDestinationHref(inviteToken: string): AppHref {
  return getInviteHref(inviteToken);
}
