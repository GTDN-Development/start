import { expect, test, type Page } from "@playwright/test";
import type PocketBase from "pocketbase";
import {
  DEFAULT_AUTH_TEST_PASSWORD,
  expectSignInPage,
  signInUser,
  signOutCurrentUser,
} from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("cross-tab sign-out redirects another protected app tab without reload", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "cross-tab-sign-out");
  const password = DEFAULT_AUTH_TEST_PASSWORD;

  let pb: PocketBase | null = null;
  let secondPage: Page | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({ pb, email, password });

    await signInUser({ page, email, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    secondPage = await page.context().newPage();
    await secondPage.goto("/cs/aplikace");
    await expect(secondPage).toHaveURL(/\/cs\/aplikace$/);

    await signOutCurrentUser(page);
    await expectSignInPage(page);
    await expectSignInPage(secondPage);
  } finally {
    if (secondPage) {
      await secondPage.close();
    }

    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});
