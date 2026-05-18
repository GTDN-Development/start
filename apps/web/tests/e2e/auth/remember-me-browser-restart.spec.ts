import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { chromium, expect, test, type BrowserContext } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, expectSignInPage, signInUser } from "../helpers/auth";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("sign in without remember me does not survive a browser restart", async ({ baseURL }) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "remember-me-unchecked");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const userDataDir = await mkdtemp(path.join(tmpdir(), "start-auth-session-only-"));

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({ pb, email, password });

    await signInAndCloseBrowser({
      baseURL,
      email,
      password,
      rememberMe: false,
      userDataDir,
    });

    const reopenedContext = await launchPersistentAuthContext(userDataDir, baseURL);

    try {
      const reopenedPage = reopenedContext.pages()[0] ?? (await reopenedContext.newPage());

      await reopenedPage.goto("/cs/aplikace");
      await expectSignInPage(reopenedPage);
    } finally {
      await reopenedContext.close();
    }
  } finally {
    await rm(userDataDir, { force: true, recursive: true });

    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});

test("sign in with remember me survives a browser restart while the token is valid", async ({
  baseURL,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "remember-me-checked");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const userDataDir = await mkdtemp(path.join(tmpdir(), "start-auth-remembered-"));

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({ pb, email, password });

    await signInAndCloseBrowser({
      baseURL,
      email,
      password,
      rememberMe: true,
      userDataDir,
    });

    const reopenedContext = await launchPersistentAuthContext(userDataDir, baseURL);

    try {
      const reopenedPage = reopenedContext.pages()[0] ?? (await reopenedContext.newPage());

      await reopenedPage.goto("/cs/aplikace");
      await expect(reopenedPage).toHaveURL(/\/cs\/aplikace$/);
    } finally {
      await reopenedContext.close();
    }
  } finally {
    await rm(userDataDir, { force: true, recursive: true });

    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});

async function signInAndCloseBrowser(options: {
  baseURL: string | undefined;
  email: string;
  password: string;
  rememberMe: boolean;
  userDataDir: string;
}): Promise<void> {
  const context = await launchPersistentAuthContext(options.userDataDir, options.baseURL);

  try {
    const page = context.pages()[0] ?? (await context.newPage());

    await signInUser({
      page,
      email: options.email,
      password: options.password,
      rememberMe: options.rememberMe,
    });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);
  } finally {
    await context.close();
  }
}

async function launchPersistentAuthContext(
  userDataDir: string,
  baseURL: string | undefined
): Promise<BrowserContext> {
  if (!baseURL) {
    throw new Error("Playwright baseURL is required for auth restart tests.");
  }

  return await chromium.launchPersistentContext(userDataDir, {
    baseURL,
  });
}
