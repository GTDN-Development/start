import { test } from "@playwright/test";
import { expectSignInPage } from "../helpers/auth";

test("guest opens protected route and is redirected to sign-in", async ({ page }) => {
  await page.goto("/cs/aplikace");
  await expectSignInPage(page);
});
