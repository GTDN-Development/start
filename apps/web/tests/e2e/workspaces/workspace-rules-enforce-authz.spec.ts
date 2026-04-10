import { createHash, randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createPocketBaseUserClient,
  createVerifiedUser,
  createWorkspace,
  deleteSignedUpUsersByEmail,
  deleteWorkspaceGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("PocketBase workspace rules enforce membership and role boundaries", async () => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "workspace-rules-owner");
  const adminEmail = createIsolatedTestEmail(run.id, "workspace-rules-admin");
  const readerEmail = createIsolatedTestEmail(run.id, "workspace-rules-reader");
  const managedMemberEmail = createIsolatedTestEmail(run.id, "workspace-rules-managed-member");
  const selfLeaveMemberEmail = createIsolatedTestEmail(run.id, "workspace-rules-self-leave");
  const outsiderEmail = createIsolatedTestEmail(run.id, "workspace-rules-outsider");
  const inviteEmail = createIsolatedTestEmail(run.id, "workspace-rules-invitee");
  const bootstrapEmail = createIsolatedTestEmail(run.id, "workspace-rules-bootstrap");
  const workspaceSlug = `workspace-rules-${suffix}`;
  const bootstrapWorkspaceSlug = `workspace-rules-bootstrap-${suffix}`;

  let adminPb: PocketBase | null = null;
  let ownerClient: PocketBase | null = null;
  let adminClient: PocketBase | null = null;
  let readerClient: PocketBase | null = null;
  let selfLeaveClient: PocketBase | null = null;
  let inviteeClient: PocketBase | null = null;
  let bootstrapClient: PocketBase | null = null;
  let outsiderClient: PocketBase | null = null;

  try {
    adminPb = await createPocketBaseAdminClient();

    const owner = await createVerifiedUser({ pb: adminPb, email: ownerEmail, password });
    const admin = await createVerifiedUser({ pb: adminPb, email: adminEmail, password });
    const reader = await createVerifiedUser({ pb: adminPb, email: readerEmail, password });
    const managedMember = await createVerifiedUser({
      pb: adminPb,
      email: managedMemberEmail,
      password,
    });
    const selfLeaveMember = await createVerifiedUser({
      pb: adminPb,
      email: selfLeaveMemberEmail,
      password,
    });
    const invitee = await createVerifiedUser({ pb: adminPb, email: inviteEmail, password });
    const bootstrapUser = await createVerifiedUser({
      pb: adminPb,
      email: bootstrapEmail,
      password,
    });
    await createVerifiedUser({ pb: adminPb, email: outsiderEmail, password });

    const { workspace } = await createWorkspace({
      pb: adminPb,
      userId: owner.id,
      name: `Workspace Rules ${suffix}`,
      slug: workspaceSlug,
    });

    const adminMembership = await adminPb.collection("workspace_members").create({
      workspace: workspace.id,
      user: admin.id,
      role: "admin",
    });
    await adminPb.collection("workspace_members").create({
      workspace: workspace.id,
      user: reader.id,
      role: "member",
    });
    const managedMemberMembership = await adminPb.collection("workspace_members").create({
      workspace: workspace.id,
      user: managedMember.id,
      role: "member",
    });
    const selfLeaveMembership = await adminPb.collection("workspace_members").create({
      workspace: workspace.id,
      user: selfLeaveMember.id,
      role: "member",
    });

    ownerClient = await createPocketBaseUserClient({
      email: ownerEmail,
      password,
    });
    adminClient = await createPocketBaseUserClient({
      email: adminEmail,
      password,
    });
    readerClient = await createPocketBaseUserClient({
      email: readerEmail,
      password,
    });
    selfLeaveClient = await createPocketBaseUserClient({
      email: selfLeaveMemberEmail,
      password,
    });
    inviteeClient = await createPocketBaseUserClient({
      email: inviteEmail,
      password,
    });
    bootstrapClient = await createPocketBaseUserClient({
      email: bootstrapEmail,
      password,
    });
    outsiderClient = await createPocketBaseUserClient({
      email: outsiderEmail,
      password,
    });

    await expect(
      outsiderClient.collection("workspaces").getOne(workspace.id)
    ).rejects.toMatchObject({
      status: 404,
    });

    const visibleMembers = await readerClient.collection("workspace_members").getFullList({
      filter: readerClient.filter("workspace = {:workspaceId}", {
        workspaceId: workspace.id,
      }),
    });
    expect(visibleMembers).toHaveLength(5);

    const updatedManagedMember = await adminClient
      .collection("workspace_members")
      .update(managedMemberMembership.id, {
        role: "admin",
      });
    expect(updatedManagedMember.role).toBe("admin");

    const inviteToken = randomBytes(32).toString("hex");
    const invite = await adminClient.collection("workspace_invites").create({
      workspace: workspace.id,
      email_normalized: inviteEmail,
      role: "member",
      token_hash: createHash("sha256").update(inviteToken).digest("hex"),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      invited_by: admin.id,
    });
    expect(invite.workspace).toBe(workspace.id);

    const acceptedMembership = await inviteeClient.collection("workspace_members").create({
      workspace: workspace.id,
      user: invitee.id,
      role: "member",
    });
    expect(acceptedMembership.workspace).toBe(workspace.id);
    expect(acceptedMembership.user).toBe(invitee.id);

    await expect(
      adminClient.collection("workspace_members").update(adminMembership.id, {
        role: "owner",
      })
    ).rejects.toMatchObject({
      status: 404,
    });

    const updatedWorkspace = await ownerClient.collection("workspaces").update(workspace.id, {
      name: `Workspace Rules Updated ${suffix}`,
    });
    expect(updatedWorkspace.name).toBe(`Workspace Rules Updated ${suffix}`);

    const bootstrapWorkspace = await bootstrapClient.collection("workspaces").create({
      name: `Workspace Bootstrap ${suffix}`,
      slug: bootstrapWorkspaceSlug,
      kind: "organization",
      created_by: bootstrapUser.id,
    });
    const bootstrapMembership = await bootstrapClient.collection("workspace_members").create({
      workspace: bootstrapWorkspace.id,
      user: bootstrapUser.id,
      role: "owner",
    });
    expect(bootstrapMembership.workspace).toBe(bootstrapWorkspace.id);
    expect(bootstrapMembership.user).toBe(bootstrapUser.id);

    await selfLeaveClient.collection("workspace_members").delete(selfLeaveMembership.id);
    await expect(
      adminPb.collection("workspace_members").getOne(selfLeaveMembership.id)
    ).rejects.toMatchObject({
      status: 404,
    });
  } finally {
    if (adminPb) {
      await deleteWorkspaceGraph({
        pb: adminPb,
        workspaceSlug,
      });
      await deleteWorkspaceGraph({
        pb: adminPb,
        workspaceSlug: bootstrapWorkspaceSlug,
      });
      await deleteSignedUpUsersByEmail(adminPb, ownerEmail);
      await deleteSignedUpUsersByEmail(adminPb, adminEmail);
      await deleteSignedUpUsersByEmail(adminPb, readerEmail);
      await deleteSignedUpUsersByEmail(adminPb, managedMemberEmail);
      await deleteSignedUpUsersByEmail(adminPb, selfLeaveMemberEmail);
      await deleteSignedUpUsersByEmail(adminPb, outsiderEmail);
      await deleteSignedUpUsersByEmail(adminPb, inviteEmail);
      await deleteSignedUpUsersByEmail(adminPb, bootstrapEmail);
    }
  }
});
