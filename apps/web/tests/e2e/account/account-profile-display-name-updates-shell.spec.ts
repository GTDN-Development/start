import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("profile display name update is reflected across the authenticated shell", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const suffix = run.id.slice(-8);
  const email = createIsolatedTestEmail(run.id, "account-profile-name");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const originalName = `Profile Original ${suffix}`;
  const updatedName = `Profile Updated ${suffix}`;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({
      pb,
      email,
      password,
      name: originalName,
    });

    await signInUser({ page, email, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
    await expect(page.getByRole("button", { name: originalName })).toBeVisible();

    await page.goto("/cs/ucet");
    await expect(page).toHaveURL(/\/cs\/ucet$/);
    await expect(page.locator("#account-profile-name")).toHaveValue(originalName);

    await page.locator("#account-profile-name").fill(updatedName);
    await page.getByRole("button", { name: "Uložit změny" }).click();

    await expect(page.getByText("Zobrazované jméno bylo aktualizováno.")).toBeVisible();
    await expect(page.locator("#account-profile-name")).toHaveValue(updatedName);
    await page.getByRole("button", { name: "Můj účet" }).click();
    await expect(page.getByText(updatedName)).toBeVisible();
    await page.keyboard.press("Escape");

    await page.reload();
    await expect(page.locator("#account-profile-name")).toHaveValue(updatedName);
    await page.getByRole("button", { name: "Můj účet" }).click();
    await expect(page.getByText(updatedName)).toBeVisible();
  } finally {
    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});
