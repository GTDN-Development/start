import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  createOrganization,
  createOrganizationMembership,
  deleteSignedUpUsersByEmail,
  deleteOrganizationGraph,
} from "../helpers/pocketbase-test-admin";
import {
  changeOrganizationMemberRole,
  leaveOrganizationFromSettings,
} from "../helpers/organizations";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("owner promotes another member to owner, then leaves the organization successfully", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "organization-owner-transfer");
  const memberEmail = createIsolatedTestEmail(run.id, "organization-member-transfer");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const organizationSlug = `ws-owner-transfer-${suffix}`;
  const organizationName = `Organization Owner Transfer ${suffix}`;
  const memberName = `Member ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({
      pb,
      email: ownerEmail,
      password,
      name: `Owner ${suffix}`,
    });
    const member = await createVerifiedUser({
      pb,
      email: memberEmail,
      password,
      name: memberName,
    });
    const { organization } = await createOrganization({
      pb,
      userId: owner.id,
      name: organizationName,
      slug: organizationSlug,
    });

    await createOrganizationMembership({
      pb,
      organizationId: organization.id,
      userId: member.id,
      role: "member",
    });

    await signInUser({ page, email: ownerEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/o/${organizationSlug}/nastaveni/clenove`);
    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationSlug}/nastaveni/clenove$`));

    await changeOrganizationMemberRole({
      page,
      memberIdentifier: memberName,
      nextRoleLabel: "Vlastník",
    });

    await leaveOrganizationFromSettings({
      page,
      organizationSlug,
    });

    await expect(page).toHaveURL(/\/cs\/aplikace$/);
    await expect(page.getByText("K této organizaci už nemáte přístup.")).toBeVisible();

    const ownerMemberships = await pb.collection("organization_members").getFullList({
      filter: pb.filter("organization = {:organizationId} && user = {:userId}", {
        organizationId: organization.id,
        userId: owner.id,
      }),
    });

    expect(ownerMemberships).toHaveLength(0);

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
    await expect(page).not.toHaveURL(new RegExp(`/cs/o/${organizationSlug}/prehled$`));
  } finally {
    if (pb) {
      await deleteOrganizationGraph({
        pb,
        organizationSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
      await deleteSignedUpUsersByEmail(pb, memberEmail);
    }
  }
});
