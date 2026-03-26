import { test, type BrowserContext } from "@playwright/test";
import type PocketBase from "pocketbase";
import {
  expectPendingVerifyEmailPage,
  signInUser,
  signUpUser,
} from "../helpers/auth";
import {
  listMailtrapMessages,
  waitForMailtrapMessage,
  type MailtrapMessage,
} from "../helpers/mailtrap";
import {
  createPocketBaseAdminClient,
  deleteSignedUpUsersByEmail,
} from "../helpers/pocketbase-admin";
import { createE2ETestRun, createIsolatedTestEmail } from "../helpers/test-run";

test("unverified user signs in and is sent to verify email without automatic resend", async ({
  page,
  browser,
}) => {
  test.setTimeout(120_000);

  const run = createE2ETestRun();
  const email = createIsolatedTestEmail(run.id, "unverified-sign-in");
  const password = "StrongPass123!";
  const firstName = "E2E";
  const lastName = "User";

  let pb: PocketBase | null = null;
  let signInContext: BrowserContext | null = null;

  try {
    pb = await createPocketBaseAdminClient();

    await signUpUser({
      page,
      email,
      password,
      firstName,
      lastName,
    });
    await expectPendingVerifyEmailPage(page, email);

    const initialVerificationMessage = await waitForMailtrapMessage({
      toEmail: email,
      receivedAfter: run.startedAt,
      timeoutMs: 45_000,
    });
    const verificationMessagesBeforeSignIn = await listVerificationMessages({
      email,
      receivedAfter: run.startedAt,
      subject: initialVerificationMessage.subject,
    });
    const knownVerificationMessageIds = new Set(
      verificationMessagesBeforeSignIn.map(function mapMessage(message) {
        return message.id;
      })
    );

    signInContext = await browser.newContext();
    const signInPage = await signInContext.newPage();

    await signInUser({ page: signInPage, email, password });
    await expectPendingVerifyEmailPage(signInPage, email);

    await assertNoAdditionalVerificationEmail({
      email,
      receivedAfter: run.startedAt,
      subject: initialVerificationMessage.subject,
      knownMessageIds: knownVerificationMessageIds,
      timeoutMs: 7_000,
      pollIntervalMs: 1_000,
    });
  } finally {
    if (signInContext) {
      await signInContext.close();
    }

    if (pb) {
      await deleteSignedUpUsersByEmail(pb, email);
    }
  }
});

async function listVerificationMessages(options: {
  email: string;
  receivedAfter: Date;
  subject: string;
}): Promise<MailtrapMessage[]> {
  const messages = await listMailtrapMessages({
    search: options.email,
  });

  return messages.filter(function filterVerificationMessages(message) {
    return (
      message.to_email.toLowerCase() === options.email.toLowerCase() &&
      message.subject === options.subject &&
      wasMailtrapMessageReceivedAfter(message, options.receivedAfter)
    );
  });
}

async function assertNoAdditionalVerificationEmail(options: {
  email: string;
  receivedAfter: Date;
  subject: string;
  knownMessageIds: ReadonlySet<number>;
  timeoutMs: number;
  pollIntervalMs: number;
}) {
  const deadline = Date.now() + options.timeoutMs;

  while (Date.now() <= deadline) {
    const verificationMessages = await listVerificationMessages({
      email: options.email,
      receivedAfter: options.receivedAfter,
      subject: options.subject,
    });
    const unexpectedMessage = verificationMessages.find(function findUnexpectedMessage(message) {
      return !options.knownMessageIds.has(message.id);
    });

    if (unexpectedMessage) {
      throw new Error(
        `Expected unverified sign-in to avoid automatic resend, but received extra verification email ${unexpectedMessage.id}.`
      );
    }

    await waitForDuration(options.pollIntervalMs);
  }
}

function wasMailtrapMessageReceivedAfter(message: MailtrapMessage, receivedAfter: Date): boolean {
  const createdAtValue = Date.parse(message.created_at);

  if (Number.isNaN(createdAtValue)) {
    return false;
  }

  return createdAtValue >= receivedAfter.getTime();
}

function waitForDuration(durationMs: number): Promise<void> {
  return new Promise(function resolveAfterTimeout(resolve) {
    setTimeout(resolve, durationMs);
  });
}
