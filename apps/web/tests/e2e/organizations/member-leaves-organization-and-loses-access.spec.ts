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
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";
import { leaveOrganizationFromSettings } from "../helpers/organizations";

test("member leaves an organization and immediately loses access to it", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "organization-member-leave-owner");
  const memberEmail = createIsolatedTestEmail(run.id, "organization-member-leave-member");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const organizationSlug = `org-member-leave-${suffix}`;
  const organizationName = `Organization Member Leave ${suffix}`;

  let pb: PocketBase | null = null;
  let organizationId = "";
  let memberId = "";

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

    organizationId = organization.id;
    memberId = member.id;

    await createOrganizationMembership({
      pb,
      organizationId: organization.id,
      userId: member.id,
      role: "member",
    });

    await signInUser({ page, email: memberEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await leaveOrganizationFromSettings({
      page,
      organizationSlug,
    });

    await expect(page).toHaveURL(/\/cs\/aplikace$/);
    await expect(page.getByText("K této organizaci už nemáte přístup.")).toBeVisible();

    await page.goto(`/cs/o/${organizationSlug}/prehled`);
    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationSlug}/prehled$`));
    await expect(page.locator("main:visible")).toContainText("Nenalezeno");

    const memberships = await pb.collection("organization_members").getFullList({
      filter: pb.filter("organization = {:organizationId} && user = {:userId}", {
        organizationId,
        userId: memberId,
      }),
    });

    expect(memberships).toHaveLength(0);
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
