import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("signed-in user opening sign-in or sign-up is redirected to effective app entry", async ({
  page,
}) => {
  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "guest-page-redirect");
  const password = DEFAULT_AUTH_TEST_PASSWORD;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({ pb, email, password });

    await signInUser({ page, email, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto("/cs/prihlasit-se");
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto("/cs/registrace");
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
  } finally {
    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});
