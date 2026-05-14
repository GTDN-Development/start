import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  createOrganization,
  deleteSignedUpUsersByEmail,
  deleteOrganizationGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("final remaining owner cannot leave the organization", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "organization-last-owner");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const organizationSlug = `org-last-owner-${suffix}`;
  const organizationName = `Org Last Owner ${suffix}`;

  let pb: PocketBase | null = null;
  let ownerId = "";
  let organizationId = "";

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({
      pb,
      email: ownerEmail,
      password,
      name: `Owner ${suffix}`,
    });

    ownerId = owner.id;

    const { organization } = await createOrganization({
      pb,
      userId: owner.id,
      name: organizationName,
      slug: organizationSlug,
    });

    organizationId = organization.id;

    await signInUser({ page, email: ownerEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/o/${organizationSlug}/nastaveni`);
    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationSlug}/nastaveni$`));
    await expect(
      page.getByText("Pro opuštění organizace musí mít organizace alespoň dva vlastníky.")
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Opustit organizaci" })).toBeDisabled();

    const ownerMemberships = await pb.collection("organization_members").getFullList({
      filter: pb.filter("organization = {:organizationId} && user = {:userId}", {
        organizationId,
        userId: ownerId,
      }),
    });

    expect(ownerMemberships).toHaveLength(1);
    expect(ownerMemberships[0]?.role).toBe("owner");
  } finally {
    if (pb) {
      await deleteOrganizationGraph({
        pb,
        organizationSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
    }
  }
});
