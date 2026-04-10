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

test("your devices shows current device and allows signing out another device", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "devices-sign-out-one");
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
    await expect(page.getByText("Toto zařízení").first()).toBeVisible();
    await expect(page.getByRole("button", { name: "Odhlásit" }).first()).toBeVisible();

    await page.getByRole("button", { name: "Odhlásit" }).first().click();

    await expect(page.getByText("Zařízení bylo odhlášeno.")).toBeVisible();

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
