import { expect, test, type BrowserContext } from "@playwright/test";
import type PocketBase from "pocketbase";
import {
  DEFAULT_AUTH_TEST_PASSWORD,
  openAccountSecurityPage,
  signInUser,
} from "../../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
} from "../../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../../helpers/test-run";

test("sign out all other devices keeps current device signed in", async ({ page, browser }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "devices-sign-out-all");
  const password = DEFAULT_AUTH_TEST_PASSWORD;

  let pb: PocketBase | null = null;
  let secondContext: BrowserContext | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({ pb, email, password });

    await signInUser({ page, email, password });
    secondContext = await browser.newContext();
    const secondPage = await secondContext.newPage();
    await signInUser({ page: secondPage, email, password });
    await expect(secondPage).toHaveURL(/\/cs\/aplikace$/);

    await openAccountSecurityPage(page);
    await expect(page.getByRole("button", { name: "Odhlásit všechna zařízení" })).toBeVisible();

    await page.getByRole("button", { name: "Odhlásit všechna zařízení" }).click();
    await page.getByRole("button", { name: "Odhlásit vše" }).click();

    await expect(page.getByText("Všechna ostatní zařízení byla odhlášena.")).toBeVisible();
    await page.goto("/cs/aplikace");
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await secondPage.goto("/cs/aplikace");
    await expect(secondPage).toHaveURL(/\/cs\/prihlasit-se$/);
  } finally {
    if (secondContext) {
      await secondContext.close();
    }

    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});
