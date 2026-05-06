import type PocketBase from "pocketbase";
import type { WorkspaceMembersRecord, WorkspacesRecord } from "@/types/pocketbase";
import { APP_HOME_PATH, getInviteHref, getWorkspaceOverviewHref } from "@/config/routes";
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
import {
  mapWorkspaceErrorCode,
  logWorkspaceServiceError,
} from "@/server/workspaces/workspace-errors";
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
    const errorCode = mapWorkspaceErrorCode(error, function mapListError(pocketBaseError) {
      if (pocketBaseError.status === 400) {
        return "BAD_REQUEST";
      }

      if (pocketBaseError.status === 401) {
        return "UNAUTHORIZED";
      }

      if (pocketBaseError.status === 403) {
        return "FORBIDDEN";
      }

      return null;
    });

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("listUserWorkspaceShells", error);
    }

    return {
      ok: false,
      errorCode,
    };
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

export async function resolveApplicationEntryHref(userId: string): Promise<AppHref> {
  const workspaceResponse = await resolveActiveWorkspaceSlugForUser(userId);

  if (!workspaceResponse.ok || !workspaceResponse.data.workspaceSlug) {
    return APP_HOME_PATH;
  }

  return getWorkspaceOverviewHref(workspaceResponse.data.workspaceSlug);
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
    const errorCode = mapWorkspaceErrorCode(
      error,
      function mapActiveWorkspaceError(pocketBaseError) {
        if (pocketBaseError.status === 400) {
          return "BAD_REQUEST";
        }

        if (pocketBaseError.status === 401) {
          return "UNAUTHORIZED";
        }

        if (pocketBaseError.status === 403) {
          return "FORBIDDEN";
        }

        if (pocketBaseError.status === 404) {
          return "NOT_FOUND";
        }

        return null;
      }
    );

    if (errorCode === "UNKNOWN_ERROR") {
      logWorkspaceServiceError("resolveActiveWorkspaceSlugForUser", error);
    }

    if (errorCode === "NOT_FOUND" || errorCode === "FORBIDDEN") {
      return {
        ok: true,
        data: {
          workspaceSlug: null,
        },
      };
    }

    return {
      ok: false,
      errorCode,
    };
  }
}

export function getInviteDestinationHref(inviteToken: string): AppHref {
  return getInviteHref(inviteToken);
}
