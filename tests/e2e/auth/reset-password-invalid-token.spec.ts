import { expect, test } from "@playwright/test";
import { resetPassword } from "../helpers/auth";

test("reset password with an invalid token stays in the reset flow and requires a new reset link", async ({
  page,
}) => {
  await page.goto("/cs/obnovit-heslo?token=invalid-reset-token");
  await resetPassword({
    page,
    password: "EvenStrongerPass123!",
  });

  await expect(page).toHaveURL(/\/cs\/obnovit-heslo\?token=invalid-reset-token$/);
  await expect(page.getByText("Obnova selhala")).toBeVisible();
  await expect(page.getByText("Tento odkaz pro obnovu je neplatný nebo vypršel.")).toBeVisible();
});
