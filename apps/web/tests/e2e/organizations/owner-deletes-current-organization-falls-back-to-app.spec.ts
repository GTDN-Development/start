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
import { deleteOrganizationFromSettings } from "../helpers/organizations";

test("owner deletes the current organization and falls back to the personal app entry", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "organization-delete-owner");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const organizationSlug = `org-delete-${suffix}`;
  const organizationName = `Org Delete ${suffix}`;

  let pb: PocketBase | null = null;
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

    organizationId = organization.id;

    await signInUser({ page, email: ownerEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await deleteOrganizationFromSettings({
      page,
      organizationSlug,
    });

    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto(`/cs/o/${organizationSlug}/prehled`);
    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationSlug}/prehled$`));
    await expect(page.locator("main:visible")).toContainText("Nenalezeno");

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
    await expect(page).not.toHaveURL(new RegExp(`/cs/o/${organizationSlug}/prehled$`));

    const organizations = await pb.collection("organizations").getFullList({
      filter: pb.filter("id = {:organizationId}", {
        organizationId,
      }),
    });

    expect(organizations).toHaveLength(0);
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
