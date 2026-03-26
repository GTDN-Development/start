import { expect, type Page } from "@playwright/test";

export const DEFAULT_AUTH_TEST_PASSWORD = "StrongPass123!";

export async function signUpUser(options: {
  page: Page;
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}): Promise<void> {
  await options.page.goto("/cs/registrace");
  await options.page.locator("#signup-firstName").fill(options.firstName ?? "E2E");
  await options.page.locator("#signup-lastName").fill(options.lastName ?? "User");
  await options.page.locator("#signup-email").fill(options.email);
  await options.page.locator("#signup-password").fill(options.password);
  await options.page.locator("form button[type=\"submit\"]").click();
}

export async function signInUser(options: {
  page: Page;
  email: string;
  password: string;
}): Promise<void> {
  await options.page.goto("/cs/prihlasit-se");
  await options.page.locator("#sign-in-email").fill(options.email);
  await options.page.locator("#sign-in-password").fill(options.password);
  await options.page.locator("form button[type=\"submit\"]").click();
}

export async function requestPasswordReset(options: {
  page: Page;
  email: string;
}): Promise<void> {
  await options.page.goto("/cs/zapomenute-heslo");
  await options.page.locator("#forgot-password-email").fill(options.email);
  await options.page.locator("form button[type=\"submit\"]").click();
}

export async function resetPassword(options: {
  page: Page;
  password: string;
  confirmPassword?: string;
}): Promise<void> {
  await options.page.locator("#reset-password-password").fill(options.password);
  await options.page
    .locator("#reset-password-confirmPassword")
    .fill(options.confirmPassword ?? options.password);
  await options.page.locator("form button[type=\"submit\"]").click();
}

export async function expectPendingVerifyEmailPage(page: Page, email: string): Promise<void> {
  await expect(page).toHaveURL(/\/cs\/overit-email\?email=/);
  await expect(page.getByText(email)).toBeVisible();
}

export async function expectSignInPage(page: Page): Promise<void> {
  await expect(page).toHaveURL(/\/cs\/prihlasit-se$/);
  await expect(page.locator("#sign-in-email")).toBeVisible();
  await expect(page.locator("#sign-in-password")).toBeVisible();
}

export async function signOutCurrentUser(page: Page): Promise<void> {
  await page.getByRole("button", { name: "Můj účet" }).click();
  await page.getByRole("menuitem", { name: "Odhlásit se" }).click();
}
