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
import { updateOrganizationSlug } from "../helpers/organizations";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("changing an organization slug redirects to the same organization under the new slug", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const ownerEmail = createIsolatedTestEmail(run.id, "organization-slug-owner");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const initialOrganizationSlug = `ws-slug-old-${suffix}`;
  const nextOrganizationSlug = `ws-slug-new-${suffix}`;
  const organizationName = `Organization Slug ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const owner = await createVerifiedUser({
      pb,
      email: ownerEmail,
      password,
      name: `Owner ${suffix}`,
    });

    await createOrganization({
      pb,
      userId: owner.id,
      name: organizationName,
      slug: initialOrganizationSlug,
    });

    await signInUser({ page, email: ownerEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await updateOrganizationSlug({
      page,
      currentSlug: initialOrganizationSlug,
      nextSlug: nextOrganizationSlug,
    });

    await page.goto(`/cs/o/${initialOrganizationSlug}/prehled`);
    await expect(page).toHaveURL(new RegExp(`/cs/o/${initialOrganizationSlug}/prehled$`));
    await expect(page.locator("main:visible")).toContainText("Nenalezeno");

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(new RegExp(`/cs/o/${nextOrganizationSlug}/prehled$`));
  } finally {
    if (pb) {
      await deleteOrganizationGraph({
        pb,
        organizationSlug: nextOrganizationSlug,
      });
      await deleteOrganizationGraph({
        pb,
        organizationSlug: initialOrganizationSlug,
      });
      await deleteSignedUpUsersByEmail(pb, ownerEmail);
    }
  }
});
