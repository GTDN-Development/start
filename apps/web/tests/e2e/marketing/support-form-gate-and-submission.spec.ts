import { Buffer } from "node:buffer";
import { expect, test } from "@playwright/test";
import type PocketBase from "pocketbase";
import { DEFAULT_AUTH_TEST_PASSWORD, expectSignInPage, signInUser } from "../helpers/auth";
import { getMailpitMessageHtml, waitForMailpitMessage } from "../helpers/mailpit";
import {
  createPocketBaseAdminClient,
  createVerifiedUser,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-test-admin";
import { getRequiredTestEnv } from "../helpers/test-env";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("support form requires sign-in and sends the submitted message with attachments", async ({
  page,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "support-form-user");
  const password = DEFAULT_AUTH_TEST_PASSWORD;
  const generalFormsRecipient = getRequiredTestEnv("GENERAL_FORMS_RECIPIENT");
  const attachmentName = "support-debug-log.txt";
  const message =
    "Ahoj, při vytváření workspace se mi po kliknutí na uložit zobrazí neočekávaná chyba 500.";

  let pb: PocketBase | null = null;

  try {
    pb = await createPocketBaseAdminClient();
    await createVerifiedUser({
      pb,
      email,
      password,
      name: `Support User ${run.id.slice(-6)}`,
    });

    await page.goto("/cs/kontakt/podpora");
    await expect(page.getByText("Přihlaste se, abychom vám mohli pomoci rychleji")).toBeVisible();
    await expect(page.getByRole("button", { name: "Přihlásit se" })).toBeVisible();
    await expect(page.locator("#support-message")).toHaveCount(0);
    await expect(page.locator("#support-attachments")).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Odeslat zprávu" })).toHaveCount(0);

    await page.getByRole("button", { name: "Přihlásit se" }).click();
    await expectSignInPage(page);

    await signInUser({ page, email, password });
    await expect(page).toHaveURL(/\/cs\/aplikace$/);

    await page.goto("/cs/kontakt/podpora");
    await expect(page.getByRole("heading", { name: "Jak vám můžeme pomoci?" })).toBeVisible();
    await expect(page.locator("#support-message")).toBeVisible();
    await expect(page.locator("#support-attachments")).toHaveCount(1);
    await expect(page.getByRole("button", { name: "Odeslat zprávu" })).toBeVisible();

    await page.locator("#support-attachments").setInputFiles([
      {
        name: attachmentName,
        mimeType: "text/plain",
        buffer: Buffer.from("console.log('support form attachment');\n"),
      },
    ]);
    await expect(page.getByText(attachmentName)).toBeVisible();

    await page.locator("#support-message").fill(message);
    await page.getByRole("button", { name: "Odeslat zprávu" }).click();

    await expect(page.getByText("Zpráva odeslána!")).toBeVisible();
    await expect(page.getByText("Ozveme se vám co nejdříve.")).toBeVisible();
    await expect(page.locator("#support-message")).toHaveValue("");
    await expect(page.getByText(attachmentName)).toHaveCount(0);

    const supportEmail = await waitForMailpitMessage({
      toEmail: generalFormsRecipient,
      subjectIncludes: "Nová zpráva z formuláře podpory",
      receivedAfter: run.startedAt,
      timeoutMs: 45_000,
    });
    const supportEmailHtml = await getMailpitMessageHtml(supportEmail.ID);
    const normalizedSupportEmailHtml = supportEmailHtml.replace(/\s+/g, " ").trim();

    expect(supportEmail.Subject).toContain("Nová zpráva z formuláře podpory");
    expect(normalizedSupportEmailHtml).toContain(email);
    expect(normalizedSupportEmailHtml).toContain(message);
    expect(normalizedSupportEmailHtml).toContain("1 příloha");
  } finally {
    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});
