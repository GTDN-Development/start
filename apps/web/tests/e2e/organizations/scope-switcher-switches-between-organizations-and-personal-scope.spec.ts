import { expect, test, type Page } from "@playwright/test";
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

test("scope switcher changes the current organization and personal scope correctly", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const userEmail = createIsolatedTestEmail(run.id, "scope-switcher-user");
  const userName = `Switcher ${suffix}`;
  const organizationASlug = `ws-scope-a-${suffix}`;
  const organizationAName = `Scope Organization A ${suffix}`;
  const organizationBSlug = `ws-scope-b-${suffix}`;
  const organizationBName = `Scope Organization B ${suffix}`;
  const password = DEFAULT_AUTH_TEST_PASSWORD;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    const user = await createVerifiedUser({
      pb,
      email: userEmail,
      password,
      name: userName,
    });

    await createOrganization({
      pb,
      userId: user.id,
      name: organizationAName,
      slug: organizationASlug,
    });
    await createOrganization({
      pb,
      userId: user.id,
      name: organizationBName,
      slug: organizationBSlug,
    });

    await signInUser({ page, email: userEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await switchScope(page, userName, organizationAName);
    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationASlug}/prehled$`));

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationASlug}/prehled$`));

    await switchScope(page, organizationAName, organizationBName);
    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationBSlug}/prehled$`));

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(new RegExp(`/cs/o/${organizationBSlug}/prehled$`));

    await switchScope(page, organizationBName, userName);
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
  } finally {
    if (pb) {
      await deleteOrganizationGraph({
        pb,
        organizationSlug: organizationASlug,
      });
      await deleteOrganizationGraph({
        pb,
        organizationSlug: organizationBSlug,
      });
      await deleteSignedUpUsersByEmail(pb, userEmail);
    }
  }
});

async function switchScope(page: Page, triggerLabel: string, nextLabel: string): Promise<void> {
  const trigger = page.getByRole("button", { name: triggerLabel }).first();

  await expect(trigger).toBeVisible();
  await trigger.click();
  await expect(page.getByText("Organizace")).toBeVisible();
  await page.getByRole("menuitem", { name: nextLabel }).click();
}
