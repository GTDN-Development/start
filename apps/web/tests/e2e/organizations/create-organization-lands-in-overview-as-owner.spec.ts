import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
  deleteOrganizationGraph,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("user creates an organization and lands in it as owner", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const email = createIsolatedTestEmail(run.id, "organization-create-owner");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const ownerName = `Organization Creator ${suffix}`;
  const organizationName = `ws-${suffix}`;

  let pb: PocketBase | null = null;
  let createdOrganizationSlug: string | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({
      pb,
      email,
      password,
      name: ownerName,
    });

    await signInUser({ page, email, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.getByRole("button", { name: ownerName }).click();
    await page
      .getByRole("menuitem", {
        name: "Vytvořit organizaci",
      })
      .click();

    await page.locator("#organization-create-name").fill(organizationName);
    await page.getByRole("button", { name: "Vytvořit organizaci" }).click();

    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationName}/prehled$`));

    const organizationMatch = page.url().match(/\/cs\/o\/([^/]+)\/prehled$/);
    createdOrganizationSlug = organizationMatch?.[1] ?? null;

    if (!createdOrganizationSlug) {
      throw new Error(`Unable to resolve created organization slug from URL: ${page.url()}`);
    }

    await page.goto(`/cs/o/${createdOrganizationSlug}/nastaveni/clenove`);
    await expect(page).toHaveURL(new RegExp(`/cs/o/${createdOrganizationSlug}/nastaveni/clenove$`));
    await expect(
      page
        .locator("tbody tr")
        .filter({
          hasText: email,
        })
        .filter({
          hasText: "Vlastník",
        })
        .first()
    ).toBeVisible();
  } finally {
    if (pb && createdOrganizationSlug) {
      await deleteOrganizationGraph({
        pb,
        organizationSlug: createdOrganizationSlug,
      });
    }

    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});
