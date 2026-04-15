import { expect, test } from "@playwright/test";

test("email verification with invalid or expired token shows a recoverable invalid state", async ({
  page,
}) => {
  await page.goto("/cs/overit-email?token=invalid-verification-token");

  await expect(page).toHaveURL(/\/cs\/overit-email\?result=invalid$/);
  await expect(page.getByRole("heading", { name: "Ověřovací odkaz vypršel" })).toBeVisible();
  await expect(
    page.getByText(
      "Tento ověřovací odkaz je neplatný nebo vypršel. Požádejte o nový a pokračujte.",
      {
        exact: true,
      }
    )
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Přejít na přihlášení" })).toBeVisible();
});
