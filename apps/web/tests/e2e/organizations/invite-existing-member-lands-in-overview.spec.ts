import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  createOrganization,
  createOrganizationInvite,
  createOrganizationMembership,
  deleteSignedUpUsersByEmail,
  deleteOrganizationGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("existing organization member opening an invite lands directly in organization overview", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "organization-owner-existing-member");
  const memberEmail = createIsolatedTestEmail(run.id, "organization-member-existing-member");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const organizationSlug = `org-existing-member-${suffix}`;
  const organizationName = `Organization Existing Member ${suffix}`;

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
      name: `Member ${suffix}`,
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

    const { token } = await createOrganizationInvite({
      pb,
      organizationId: organization.id,
      email: memberEmail,
      role: "member",
      invitedByUserId: owner.id,
    });

    await signInUser({ page, email: memberEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/invite/${token}`);
    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationSlug}/prehled$`));
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
