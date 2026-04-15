import { expect, test, type BrowserContext } from "@playwright/test";
import type PocketBase from "pocketbase";
import {
  changeAccountPassword,
  DEFAULT_AUTH_TEST_PASSWORD,
  expectSignInPage,
  signInUser,
} from "../../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
} from "../../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../../helpers/test-run";

test("change password revokes current session and requires fresh sign-in", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "account-password-change");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const newPassword = "EvenStrongerPass123!";

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({ pb, email, password });

    await signInUser({ page, email, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await changeAccountPassword({
      page,
      currentPassword: password,
      newPassword,
    });
    await expectSignInPage(page);

    await page.goto("/cs/aplikace");
    await expectSignInPage(page);

    await signInUser({ page, email, password });
    await expect(page).toHaveURL(/\/cs\/prihlasit-se$/);
    await expect(page.getByText("Přihlášení selhalo")).toBeVisible();

    await signInUser({ page, email, password: newPassword });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
  } finally {
    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});

test("change password signs out other devices on their next request", async ({ page, browser }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "account-password-change-other-device");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const newPassword = "EvenStrongerPass123!";

  let pb: PocketBase | null = null;
  let secondContext: BrowserContext | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({ pb, email, password });

    await signInUser({ page, email, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();

    await signInUser({ page: secondPage, email, password });
    await expect(secondPage).toHaveURL(/\/cs\/aplikace$/);

    await changeAccountPassword({
      page,
      currentPassword: password,
      newPassword,
    });
    await expectSignInPage(page);

    await secondPage.goto("/cs/aplikace");
    await expectSignInPage(secondPage);
  } finally {
    if (secondContext) {
      await secondContext.close();
    }

    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});
