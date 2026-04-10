import { createHash, randomBytes } from "node:crypto";
import PocketBase, { ClientResponseError, type RecordModel } from "pocketbase";
import type {
  WorkspaceInvitesRecord,
  WorkspaceMembersRecord,
  WorkspacesRecord,
} from "../../../src/types/pocketbase";
import { getRequiredTestEnv } from "./test-env";

const DEFAULT_WORKSPACE_INVITE_TTL_DAYS = 7;

export async function createPocketBaseAdminClient(): Promise<PocketBase> {
  const pb = new PocketBase(getRequiredTestEnv("NEXT_PUBLIC_PB_URL"));

  pb.autoCancellation(false);

  await pb
    .collection("_superusers")
    .authWithPassword(
      getRequiredTestEnv("PB_SUPERUSER_EMAIL"),
      getRequiredTestEnv("PB_SUPERUSER_PASSWORD")
    );

  return pb;
}

export async function createPocketBaseUserClient(options: {
  email: string;
  password: string;
}): Promise<PocketBase> {
  const pb = new PocketBase(getRequiredTestEnv("NEXT_PUBLIC_PB_URL"));

  pb.autoCancellation(false);

  await pb.collection("users").authWithPassword(options.email, options.password);

  return pb;
}

export async function deleteSignedUpUsersByEmail(pb: PocketBase, email: string): Promise<void> {
  const users = await pb.collection("users").getFullList<RecordModel>({
    filter: pb.filter("email = {:email}", {
      email,
    }),
  });

  for (const user of users) {
    try {
      await deleteUserDeviceSessionsByUserId(pb, user.id);
      await pb.collection("users").delete(user.id);
    } catch (error) {
      if (error instanceof ClientResponseError && error.status === 404) {
        continue;
      }

      throw error;
    }
  }
}

export async function createVerifiedUser(options: {
  pb: PocketBase;
  email: string;
  password: string;
  name?: string;
}): Promise<RecordModel> {
  return await options.pb.collection("users").create({
    email: options.email,
    password: options.password,
    passwordConfirm: options.password,
    name: options.name ?? "E2E User",
    verified: true,
  });
}

export async function createUser(options: {
  pb: PocketBase;
  email: string;
  password: string;
  name?: string;
  verified?: boolean;
}): Promise<RecordModel> {
  return await options.pb.collection("users").create({
    email: options.email,
    password: options.password,
    passwordConfirm: options.password,
    name: options.name ?? "E2E User",
    verified: options.verified ?? false,
  });
}

export async function deleteUserDeviceSessionsByUserId(
  pb: PocketBase,
  userId: string
): Promise<void> {
  const deviceSessions = await pb.collection("user_device_sessions").getFullList({
    filter: pb.filter("user = {:userId}", {
      userId,
    }),
  });

  for (const deviceSession of deviceSessions) {
    await pb.collection("user_device_sessions").delete(deviceSession.id);
  }
}

export async function createWorkspace(options: {
  pb: PocketBase;
  userId: string;
  name: string;
  slug: string;
}): Promise<{
  workspace: WorkspacesRecord;
  membership: WorkspaceMembersRecord;
}> {
  const workspace = await options.pb.collection("workspaces").create<WorkspacesRecord>({
    name: options.name,
    slug: options.slug,
    kind: "organization",
    created_by: options.userId,
  });
  const membership = await options.pb
    .collection("workspace_members")
    .create<WorkspaceMembersRecord>({
      workspace: workspace.id,
      user: options.userId,
      role: "owner",
    });

  return {
    workspace,
    membership,
  };
}

export async function createWorkspaceMembership(options: {
  pb: PocketBase;
  workspaceId: string;
  userId: string;
  role: WorkspaceMembersRecord["role"];
}): Promise<WorkspaceMembersRecord> {
  return await options.pb.collection("workspace_members").create<WorkspaceMembersRecord>({
    workspace: options.workspaceId,
    user: options.userId,
    role: options.role,
  });
}

export async function createWorkspaceInvite(options: {
  pb: PocketBase;
  workspaceId: string;
  email: string;
  role: WorkspaceInvitesRecord["role"];
  invitedByUserId: string;
  expiresAt?: string;
}): Promise<{
  invite: WorkspaceInvitesRecord;
  token: string;
}> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invite = await options.pb.collection("workspace_invites").create<WorkspaceInvitesRecord>({
    workspace: options.workspaceId,
    email_normalized: options.email.trim().toLowerCase(),
    role: options.role,
    token_hash: tokenHash,
    expires_at: options.expiresAt ?? createWorkspaceInviteExpiryDate(),
    invited_by: options.invitedByUserId,
  });

  return {
    invite,
    token,
  };
}

export async function deleteWorkspaceGraph(options: {
  pb: PocketBase;
  workspaceId?: string;
  workspaceSlug?: string;
}): Promise<void> {
  const workspace = await resolveWorkspaceForCleanup(options);

  if (!workspace) {
    return;
  }

  const invites = await options.pb
    .collection("workspace_invites")
    .getFullList<WorkspaceInvitesRecord>({
      filter: options.pb.filter("workspace = {:workspaceId}", {
        workspaceId: workspace.id,
      }),
    });
  const memberships = await options.pb
    .collection("workspace_members")
    .getFullList<WorkspaceMembersRecord>({
      filter: options.pb.filter("workspace = {:workspaceId}", {
        workspaceId: workspace.id,
      }),
    });

  for (const invite of invites) {
    await deletePocketBaseRecordIgnoringNotFound(() =>
      options.pb.collection("workspace_invites").delete(invite.id)
    );
  }

  for (const membership of memberships) {
    await deletePocketBaseRecordIgnoringNotFound(() =>
      options.pb.collection("workspace_members").delete(membership.id)
    );
  }

  await deletePocketBaseRecordIgnoringNotFound(() =>
    options.pb.collection("workspaces").delete(workspace.id)
  );
}

async function resolveWorkspaceForCleanup(options: {
  pb: PocketBase;
  workspaceId?: string;
  workspaceSlug?: string;
}): Promise<WorkspacesRecord | null> {
  if (options.workspaceId) {
    try {
      return await options.pb
        .collection("workspaces")
        .getOne<WorkspacesRecord>(options.workspaceId);
    } catch (error) {
      if (error instanceof ClientResponseError && error.status === 404) {
        return null;
      }

      throw error;
    }
  }

  if (!options.workspaceSlug) {
    return null;
  }

  try {
    return await options.pb.collection("workspaces").getFirstListItem<WorkspacesRecord>(
      options.pb.filter("slug = {:workspaceSlug}", {
        workspaceSlug: options.workspaceSlug,
      })
    );
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return null;
    }

    throw error;
  }
}

async function deletePocketBaseRecordIgnoringNotFound(
  deleteAction: () => Promise<unknown>
): Promise<void> {
  try {
    await deleteAction();
  } catch (error) {
    if (error instanceof ClientResponseError && error.status === 404) {
      return;
    }

    throw error;
  }
}

function createWorkspaceInviteExpiryDate(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_WORKSPACE_INVITE_TTL_DAYS);

  return expiresAt.toISOString();
}
