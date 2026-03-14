import PocketBase, { ClientResponseError } from "pocketbase";
import type {
  UsersRecord,
  WorkspaceInvitesRecord,
  WorkspaceMembersRecord,
  WorkspacesRecord,
} from "@/types/pocketbase";
import type { WorkspaceMemberRole } from "@/server/workspaces/workspace-types";

export type WorkspaceMemberRecordWithExpand = WorkspaceMembersRecord & {
  expand?: {
    workspace?: WorkspacesRecord;
    user?: UsersRecord;
  };
};

export type WorkspaceInviteRecordWithExpand = WorkspaceInvitesRecord & {
  expand?: {
    invited_by?: UsersRecord;
  };
};

export async function findWorkspaceBySlug(
  pb: PocketBase,
  workspaceSlug: string
): Promise<WorkspacesRecord | null> {
  try {
    return await pb
      .collection("workspaces")
      .getFirstListItem<WorkspacesRecord>(pb.filter("slug = {:workspaceSlug}", { workspaceSlug }));
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function findWorkspaceById(
  pb: PocketBase,
  workspaceId: string
): Promise<WorkspacesRecord | null> {
  try {
    return await pb.collection("workspaces").getOne<WorkspacesRecord>(workspaceId);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

export async function listUserWorkspaceMembershipRecords(
  pb: PocketBase,
  userId: string
): Promise<WorkspaceMemberRecordWithExpand[]> {
  return pb.collection("workspace_members").getFullList<WorkspaceMemberRecordWithExpand>({
    filter: pb.filter("user = {:userId}", { userId }),
    expand: "workspace",
    sort: "-created",
  });
}

export async function findWorkspaceMembershipByWorkspaceAndUser(
  pb: PocketBase,
  workspaceId: string,
  userId: string
): Promise<WorkspaceMembersRecord | null> {
  try {
    return await pb.collection("workspace_members").getFirstListItem<WorkspaceMembersRecord>(
      pb.filter("workspace = {:workspaceId} && user = {:userId}", {
        workspaceId,
        userId,
      })
    );
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

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

export async function ensureWorkspaceMembership(
  pb: PocketBase,
  workspaceId: string,
  userId: string,
  role: WorkspaceMemberRole
): Promise<WorkspaceMembersRecord> {
  try {
    return await pb.collection("workspace_members").create<WorkspaceMembersRecord>({
      workspace: workspaceId,
      user: userId,
      role,
    });
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 400) {
      const membership = await findWorkspaceMembershipByWorkspaceAndUser(pb, workspaceId, userId);

      if (membership) {
        if (membership.role !== role) {
          return pb.collection("workspace_members").update<WorkspaceMembersRecord>(membership.id, {
            role,
          });
        }

        return membership;
      }
    }

    throw error;
  }
}

export async function countWorkspaceOwners(pb: PocketBase, workspaceId: string): Promise<number> {
  const listResponse = await pb
    .collection("workspace_members")
    .getList<WorkspaceMembersRecord>(1, 1, {
      filter: pb.filter("workspace = {:workspaceId} && role = 'owner'", { workspaceId }),
    });

  return listResponse.totalItems;
}

export async function listWorkspaceMemberRecordsByWorkspace(
  pb: PocketBase,
  workspaceId: string
): Promise<WorkspaceMemberRecordWithExpand[]> {
  return pb.collection("workspace_members").getFullList<WorkspaceMemberRecordWithExpand>({
    filter: pb.filter("workspace = {:workspaceId}", { workspaceId }),
    expand: "user",
    sort: "-created",
  });
}

export async function findInviteByHash(
  pb: PocketBase,
  inviteHash: string
): Promise<WorkspaceInvitesRecord | null> {
  try {
    return await pb
      .collection("workspace_invites")
      .getFirstListItem<WorkspaceInvitesRecord>(
        pb.filter("token_hash = {:inviteHash}", { inviteHash })
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

export async function findInviteByWorkspaceAndEmail(
  pb: PocketBase,
  workspaceId: string,
  emailNormalized: string
): Promise<WorkspaceInvitesRecord | null> {
  try {
    return await pb.collection("workspace_invites").getFirstListItem<WorkspaceInvitesRecord>(
      pb.filter("workspace = {:workspaceId} && email_normalized = {:emailNormalized}", {
        workspaceId,
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

export async function listWorkspaceInviteRecordsByWorkspace(
  pb: PocketBase,
  workspaceId: string
): Promise<WorkspaceInviteRecordWithExpand[]> {
  return pb.collection("workspace_invites").getFullList<WorkspaceInviteRecordWithExpand>({
    filter: pb.filter("workspace = {:workspaceId}", { workspaceId }),
    expand: "invited_by",
    sort: "-created",
  });
}

export async function safeDeleteInvite(pb: PocketBase, inviteId: string): Promise<void> {
  try {
    await pb.collection("workspace_invites").delete(inviteId);
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return;
    }

    throw error;
  }
}
