import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, deleteAccountFromSettings, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  createOrganization,
  deleteSignedUpUsersByEmail,
  deleteOrganizationGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("account deletion is blocked when the current user is the last organization owner", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "account-delete-last-owner");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const organizationSlug = `org-account-last-owner-${suffix}`;
  const organizationName = `Org Account Last Owner ${suffix}`;

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
    const { organization } = await createOrganization({
      pb,
      userId: owner.id,
      name: organizationName,
      slug: organizationSlug,
    });

    ownerId = owner.id;
    organizationId = organization.id;

    await signInUser({ page, email: ownerEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await deleteAccountFromSettings({
      page,
      password,
    });

    await expect(page).toHaveURL(/\/cs\/ucet$/);
    await expect(
      page.getByText(
        "Účet teď nelze smazat, protože jste poslední vlastník alespoň jedné organizace."
      )
    ).toBeVisible();

    const users = await pb.collection("users").getFullList({
      filter: pb.filter("id = {:userId}", {
        userId: ownerId,
      }),
    });
    const memberships = await pb.collection("organization_members").getFullList({
      filter: pb.filter("organization = {:organizationId} && user = {:userId}", {
        organizationId,
        userId: ownerId,
      }),
    });

    expect(users).toHaveLength(1);
    expect(memberships).toHaveLength(1);
    expect(memberships[0]?.role).toBe("owner");

    await page.goto("/cs/aplikace");
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
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
