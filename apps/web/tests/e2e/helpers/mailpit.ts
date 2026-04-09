import { getRequiredTestEnv } from "./test-env";

const DEFAULT_MAILPIT_TIMEOUT_MS = 30_000;
const DEFAULT_MAILPIT_POLL_INTERVAL_MS = 1_000;
const DEFAULT_MAILPIT_SEARCH_LIMIT = 50;

export type MailpitAddress = {
  Address: string;
  Name?: string;
};

export type MailpitMessageSummary = {
  ID: string;
  Subject: string;
  To?: MailpitAddress[];
  Created: string;
};

export type MailpitMessage = {
  ID: string;
  Subject: string;
  To?: MailpitAddress[];
  HTML?: string;
  Text?: string;
};

type MailpitMessagesResponse = {
  messages: MailpitMessageSummary[];
};

export type WaitForMailpitMessageOptions = {
  toEmail: string;
  subjectIncludes?: string;
  receivedAfter?: Date;
  timeoutMs?: number;
  pollIntervalMs?: number;
};

export type PocketBaseEmailLinkAction = "verify-email" | "reset-password" | "confirm-email-change";

export async function searchMailpitMessages(query: string): Promise<MailpitMessageSummary[]> {
  const searchParams = new URLSearchParams({
    query,
    limit: String(DEFAULT_MAILPIT_SEARCH_LIMIT),
  });

  const response = await requestMailpitJson<MailpitMessagesResponse>(
    `/api/v1/search?${searchParams.toString()}`
  );

  return response.messages ?? [];
}

export async function getMailpitMessage(messageId: string): Promise<MailpitMessage> {
  return await requestMailpitJson<MailpitMessage>(
    `/api/v1/message/${encodeURIComponent(messageId)}`
  );
}

export async function getMailpitMessageHtml(messageId: string): Promise<string> {
  return await requestMailpitText(`/view/${encodeURIComponent(messageId)}.html`);
}

export async function waitForMailpitMessage(
  options: WaitForMailpitMessageOptions
): Promise<MailpitMessageSummary> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_MAILPIT_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_MAILPIT_POLL_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;
  const query = buildMailpitSearchQuery(options);

  while (Date.now() <= deadline) {
    const messages = await searchMailpitMessages(query);
    const matchingMessage = messages
      .filter(function filterMatchingMessages(message) {
        return matchesMailpitMessage(message, options);
      })
      .sort(sortMailpitMessagesByCreatedAtDesc)[0];

    if (matchingMessage) {
      return matchingMessage;
    }

    await waitForDuration(pollIntervalMs);
  }

  throw new Error(
    `Timed out waiting for Mailpit message for ${options.toEmail} after ${timeoutMs}ms.`
  );
}

export async function waitForPocketBaseEmailLinkPath(
  options: WaitForMailpitMessageOptions & {
    action: PocketBaseEmailLinkAction;
  }
): Promise<string> {
  const message = await waitForMailpitMessage(options);
  const html = await getMailpitMessageHtml(message.ID);

  return extractPocketBaseEmailLinkPath({
    html,
    action: options.action,
  });
}

export function extractPocketBaseEmailLinkPath(options: {
  html: string;
  action: PocketBaseEmailLinkAction;
}): string {
  const hrefValues = Array.from(options.html.matchAll(/href=(["'])(.*?)\1/gi)).map(
    function mapHrefMatch(match) {
      return decodeHtmlAttribute(match[2] ?? "");
    }
  );

  for (const hrefValue of hrefValues) {
    const parsedUrl = tryParseMailLinkUrl(hrefValue);

    if (!parsedUrl) {
      continue;
    }

    if (
      parsedUrl.pathname === "/api/pocketbase/email-link" &&
      parsedUrl.searchParams.get("action") === options.action &&
      parsedUrl.searchParams.get("token")
    ) {
      const searchValue = parsedUrl.searchParams.toString();

      return searchValue ? `${parsedUrl.pathname}?${searchValue}` : parsedUrl.pathname;
    }
  }

  throw new Error(
    `Unable to find PocketBase email link for action "${options.action}" in Mailpit HTML.`
  );
}

function buildMailpitSearchQuery(options: WaitForMailpitMessageOptions): string {
  const queryParts = [`to:${options.toEmail.trim()}`];

  if (options.subjectIncludes) {
    queryParts.push(`subject:"${escapeMailpitSearchValue(options.subjectIncludes)}"`);
  }

  return queryParts.join(" ");
}

function escapeMailpitSearchValue(value: string): string {
  return value.trim().replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function matchesMailpitMessage(
  message: MailpitMessageSummary,
  options: WaitForMailpitMessageOptions
): boolean {
  const normalizedTargetEmail = options.toEmail.trim().toLowerCase();
  const messageRecipients = message.To ?? [];

  if (
    !messageRecipients.some(function hasMatchingRecipient(recipient) {
      return recipient.Address.trim().toLowerCase() === normalizedTargetEmail;
    })
  ) {
    return false;
  }

  if (
    options.subjectIncludes &&
    !message.Subject.toLowerCase().includes(options.subjectIncludes.trim().toLowerCase())
  ) {
    return false;
  }

  if (options.receivedAfter && !wasMessageReceivedAfter(message, options.receivedAfter)) {
    return false;
  }

  return true;
}

function sortMailpitMessagesByCreatedAtDesc(
  a: MailpitMessageSummary,
  b: MailpitMessageSummary
): number {
  const createdAtA = Date.parse(a.Created);
  const createdAtB = Date.parse(b.Created);

  if (Number.isNaN(createdAtA) && Number.isNaN(createdAtB)) {
    return 0;
  }

  if (Number.isNaN(createdAtA)) {
    return 1;
  }

  if (Number.isNaN(createdAtB)) {
    return -1;
  }

  return createdAtB - createdAtA;
}

function wasMessageReceivedAfter(message: MailpitMessageSummary, receivedAfter: Date): boolean {
  const createdAtValue = Date.parse(message.Created);

  if (Number.isNaN(createdAtValue)) {
    return false;
  }

  return createdAtValue >= receivedAfter.getTime();
}

async function requestMailpitJson<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(new URL(path, getMailpitBaseUrl()));

  if (!response.ok) {
    throw await createMailpitError(response);
  }

  return (await response.json()) as TResponse;
}

async function requestMailpitText(path: string): Promise<string> {
  const response = await fetch(new URL(path, getMailpitBaseUrl()));

  if (!response.ok) {
    throw await createMailpitError(response);
  }

  return await response.text();
}

function getMailpitBaseUrl(): string {
  const baseUrl = getRequiredTestEnv("MAILPIT_BASE_URL");

  return baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;
}

async function createMailpitError(response: Response): Promise<Error> {
  const responseBody = await response.text();

  return new Error(
    `Mailpit request failed with status ${response.status}: ${truncateErrorBody(responseBody)}`
  );
}

function truncateErrorBody(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.length <= 300) {
    return trimmedValue;
  }

  return `${trimmedValue.slice(0, 297)}...`;
}

export function decodeHtmlAttribute(value: string): string {
  return value.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'").trim();
}

function tryParseMailLinkUrl(value: string): URL | null {
  try {
    return new URL(value, "http://127.0.0.1");
  } catch {
    return null;
  }
}

async function waitForDuration(durationMs: number): Promise<void> {
  await new Promise(function resolveAfterTimeout(resolve) {
    setTimeout(resolve, durationMs);
  });
}
