import { createHash, randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createPocketBaseUserClient,
  createVerifiedUser,
  createOrganization,
  deleteSignedUpUsersByEmail,
  deleteOrganizationGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("PocketBase organization rules enforce membership and role boundaries", async () => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "organization-rules-owner");
  const adminEmail = createIsolatedTestEmail(run.id, "organization-rules-admin");
  const readerEmail = createIsolatedTestEmail(run.id, "organization-rules-reader");
  const managedMemberEmail = createIsolatedTestEmail(run.id, "organization-rules-managed-member");
  const selfLeaveMemberEmail = createIsolatedTestEmail(run.id, "organization-rules-self-leave");
  const outsiderEmail = createIsolatedTestEmail(run.id, "organization-rules-outsider");
  const inviteEmail = createIsolatedTestEmail(run.id, "organization-rules-invitee");
  const bootstrapEmail = createIsolatedTestEmail(run.id, "organization-rules-bootstrap");
  const organizationSlug = `organization-rules-${suffix}`;
  const bootstrapOrganizationSlug = `organization-rules-bootstrap-${suffix}`;

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

    const { organization } = await createOrganization({
      pb: adminPb,
      userId: owner.id,
      name: `Organization Rules ${suffix}`,
      slug: organizationSlug,
    });

    const adminMembership = await adminPb.collection("organization_members").create({
      organization: organization.id,
      user: admin.id,
      role: "admin",
    });
    await adminPb.collection("organization_members").create({
      organization: organization.id,
      user: reader.id,
      role: "member",
    });
    const managedMemberMembership = await adminPb.collection("organization_members").create({
      organization: organization.id,
      user: managedMember.id,
      role: "member",
    });
    const selfLeaveMembership = await adminPb.collection("organization_members").create({
      organization: organization.id,
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
      outsiderClient.collection("organizations").getOne(organization.id)
    ).rejects.toMatchObject({
      status: 404,
    });

    const visibleMembers = await readerClient.collection("organization_members").getFullList({
      filter: readerClient.filter("organization = {:organizationId}", {
        organizationId: organization.id,
      }),
    });
    expect(visibleMembers).toHaveLength(5);

    const updatedManagedMember = await adminClient
      .collection("organization_members")
      .update(managedMemberMembership.id, {
        role: "admin",
      });
    expect(updatedManagedMember.role).toBe("admin");

    const inviteToken = randomBytes(32).toString("hex");
    const invite = await adminClient.collection("organization_invites").create({
      organization: organization.id,
      email_normalized: inviteEmail,
      role: "member",
      token_hash: createHash("sha256").update(inviteToken).digest("hex"),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      invited_by: admin.id,
    });
    expect(invite.organization).toBe(organization.id);

    const acceptedInvite = await inviteeClient.send<{
      state: string;
      organization?: {
        id: string;
      };
    }>("/api/start/organization-invites/accept", {
      method: "POST",
      body: {
        token: inviteToken,
      },
    });
    expect(acceptedInvite.state).toBe("accepted");
    expect(acceptedInvite.organization?.id).toBe(organization.id);

    const acceptedMemberships = await adminPb.collection("organization_members").getFullList({
      filter: adminPb.filter("organization = {:organizationId} && user = {:userId}", {
        organizationId: organization.id,
        userId: invitee.id,
      }),
    });
    expect(acceptedMemberships).toHaveLength(1);
    expect(acceptedMemberships[0]?.role).toBe("member");

    await expect(
      adminClient.collection("organization_members").update(adminMembership.id, {
        role: "owner",
      })
    ).rejects.toMatchObject({
      status: 404,
    });

    const updatedOrganization = await ownerClient
      .collection("organizations")
      .update(organization.id, {
        name: `Organization Rules Updated ${suffix}`,
      });
    expect(updatedOrganization.name).toBe(`Organization Rules Updated ${suffix}`);

    const bootstrapOrganization = await bootstrapClient.send<{
      organization: {
        id: string;
        slug: string;
        role: string;
      };
    }>("/api/start/organizations", {
      method: "POST",
      body: {
        name: `Organization Bootstrap ${suffix}`,
        slug: bootstrapOrganizationSlug,
      },
    });
    expect(bootstrapOrganization.organization.slug).toBe(bootstrapOrganizationSlug);
    expect(bootstrapOrganization.organization.role).toBe("owner");

    const bootstrapMemberships = await adminPb.collection("organization_members").getFullList({
      filter: adminPb.filter("organization = {:organizationId} && user = {:userId}", {
        organizationId: bootstrapOrganization.organization.id,
        userId: bootstrapUser.id,
      }),
    });
    expect(bootstrapMemberships).toHaveLength(1);
    expect(bootstrapMemberships[0]?.role).toBe("owner");

    await selfLeaveClient.collection("organization_members").delete(selfLeaveMembership.id);
    await expect(
      adminPb.collection("organization_members").getOne(selfLeaveMembership.id)
    ).rejects.toMatchObject({
      status: 404,
    });
  } finally {
    if (adminPb) {
      await deleteOrganizationGraph({
        pb: adminPb,
        organizationSlug,
      });
      await deleteOrganizationGraph({
        pb: adminPb,
        organizationSlug: bootstrapOrganizationSlug,
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
