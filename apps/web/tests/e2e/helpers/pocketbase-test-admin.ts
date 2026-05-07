import { createHash, randomBytes } from "node:crypto";
import PocketBase, { ClientResponseError, type RecordModel } from "pocketbase";
import type {
  OrganizationInvitesRecord,
  OrganizationMembersRecord,
  OrganizationsRecord,
} from "../../../src/types/pocketbase";
import { getRequiredTestEnv } from "./test-env";

const DEFAULT_ORGANIZATION_INVITE_TTL_DAYS = 7;

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
    emailVisibility: true,
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
    emailVisibility: true,
    password: options.password,
    passwordConfirm: options.password,
    name: options.name ?? "E2E User",
    verified: options.verified ?? false,
  });
}

export async function createOrganization(options: {
  pb: PocketBase;
  userId: string;
  name: string;
  slug: string;
}): Promise<{
  organization: OrganizationsRecord;
  membership: OrganizationMembersRecord;
}> {
  const organization = await options.pb.collection("organizations").create<OrganizationsRecord>({
    name: options.name,
    slug: options.slug,
    kind: "organization",
    created_by: options.userId,
  });
  const membership = await options.pb
    .collection("organization_members")
    .create<OrganizationMembersRecord>({
      organization: organization.id,
      user: options.userId,
      role: "owner",
    });

  return {
    organization,
    membership,
  };
}

export async function createOrganizationMembership(options: {
  pb: PocketBase;
  organizationId: string;
  userId: string;
  role: OrganizationMembersRecord["role"];
}): Promise<OrganizationMembersRecord> {
  return await options.pb.collection("organization_members").create<OrganizationMembersRecord>({
    organization: options.organizationId,
    user: options.userId,
    role: options.role,
  });
}

export async function createOrganizationInvite(options: {
  pb: PocketBase;
  organizationId: string;
  email: string;
  role: OrganizationInvitesRecord["role"];
  invitedByUserId: string;
  expiresAt?: string;
}): Promise<{
  invite: OrganizationInvitesRecord;
  token: string;
}> {
  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const invite = await options.pb
    .collection("organization_invites")
    .create<OrganizationInvitesRecord>({
      organization: options.organizationId,
      email_normalized: options.email.trim().toLowerCase(),
      role: options.role,
      token_hash: tokenHash,
      expires_at: options.expiresAt ?? createOrganizationInviteExpiryDate(),
      invited_by: options.invitedByUserId,
    });

  return {
    invite,
    token,
  };
}

export async function deleteOrganizationGraph(options: {
  pb: PocketBase;
  organizationId?: string;
  organizationSlug?: string;
}): Promise<void> {
  const organization = await resolveOrganizationForCleanup(options);

  if (!organization) {
    return;
  }

  const invites = await options.pb
    .collection("organization_invites")
    .getFullList<OrganizationInvitesRecord>({
      filter: options.pb.filter("organization = {:organizationId}", {
        organizationId: organization.id,
      }),
    });
  const memberships = await options.pb
    .collection("organization_members")
    .getFullList<OrganizationMembersRecord>({
      filter: options.pb.filter("organization = {:organizationId}", {
        organizationId: organization.id,
      }),
    });

  for (const invite of invites) {
    await deletePocketBaseRecordIgnoringNotFound(() =>
      options.pb.collection("organization_invites").delete(invite.id)
    );
  }

  for (const membership of memberships) {
    await deletePocketBaseRecordIgnoringNotFound(() =>
      options.pb.collection("organization_members").delete(membership.id)
    );
  }

  await deletePocketBaseRecordIgnoringNotFound(() =>
    options.pb.collection("organizations").delete(organization.id)
  );
}

async function resolveOrganizationForCleanup(options: {
  pb: PocketBase;
  organizationId?: string;
  organizationSlug?: string;
}): Promise<OrganizationsRecord | null> {
  if (options.organizationId) {
    try {
      return await options.pb
        .collection("organizations")
        .getOne<OrganizationsRecord>(options.organizationId);
    } catch (error) {
      if (error instanceof ClientResponseError && error.status === 404) {
        return null;
      }

      throw error;
    }
  }

  if (!options.organizationSlug) {
    return null;
  }

  try {
    return await options.pb.collection("organizations").getFirstListItem<OrganizationsRecord>(
      options.pb.filter("slug = {:organizationSlug}", {
        organizationSlug: options.organizationSlug,
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

function createOrganizationInviteExpiryDate(): string {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + DEFAULT_ORGANIZATION_INVITE_TTL_DAYS);

  return expiresAt.toISOString();
}
