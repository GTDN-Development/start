import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("sign in with invalid credentials stays on sign-in and shows an actionable auth error", async ({
  page,
}) => {
  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "invalid-sign-in");
  const password = DEFAULT_AUTH_TEST_PASSWORD;

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({ pb, email, password });

    await signInUser({
      page,
      email,
      password: `${password}!`,
    });

    await expect(page).toHaveURL(/\/cs\/prihlasit-se$/);
    await expect(page.getByText("Přihlášení selhalo")).toBeVisible();
    await expect(
      page.getByText("Neplatné přihlašovací údaje. Zkuste to prosím znovu.")
    ).toBeVisible();
  } finally {
    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});
