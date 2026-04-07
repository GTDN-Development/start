import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import {
  confirmEmailChange,
  DEFAULT_AUTH_TEST_PASSWORD,
  expectSignInPage,
  requestAccountEmailChange,
  signInUser,
} from "../helpers/auth";
import { waitForPocketBaseEmailLinkPath } from "../helpers/mailpit";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("email change request sends confirmation link to the new email", async ({ page }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const oldEmail = createIsolatedTestEmail(run.id, "email-change-old");
  const newEmail = createIsolatedTestEmail(run.id, "email-change-new");
  const password = DEFAULT_AUTH_TEST_PASSWORD;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({ pb, email: oldEmail, password });

    await signInUser({ page, email: oldEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await requestAccountEmailChange({
      page,
      newEmail,
    });

    await expect(page.getByText("Ověřovací e-mail odeslán")).toBeVisible();
    await expect(
      page.getByText(`Na adresu ${newEmail} jsme poslali potvrzovací odkaz.`)
    ).toBeVisible();

    const confirmPath = await waitForPocketBaseEmailLinkPath({
      toEmail: newEmail,
      receivedAfter: run.startedAt,
      action: "confirm-email-change",
      timeoutMs: 45_000,
    });

    await page.goto(confirmPath);
    await confirmEmailChange({ page, password });
    await expectSignInPage(page);

    await signInUser({ page, email: oldEmail, password });
    await expect(page).toHaveURL(/\/cs\/prihlasit-se$/);
    await expect(page.getByText("Přihlášení selhalo")).toBeVisible();

    await signInUser({ page, email: newEmail, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
  } finally {
    if (pb) {
      await deleteSignedUpUsersByEmail(pb, oldEmail);
      await deleteSignedUpUsersByEmail(pb, newEmail);
    }
  }
});
