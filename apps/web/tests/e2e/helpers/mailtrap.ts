import { getRequiredTestEnv, getRequiredTestEnvNumber } from "./test-env";

const MAILTRAP_API_BASE_URL = "https://mailtrap.io";
const DEFAULT_MAILTRAP_TIMEOUT_MS = 30_000;
const DEFAULT_MAILTRAP_POLL_INTERVAL_MS = 1_000;

export type MailtrapMessage = {
  id: number;
  inbox_id: number;
  subject: string;
  sent_at: string;
  from_email: string;
  from_name: string | null;
  to_email: string;
  to_name: string | null;
  created_at: string;
  updated_at: string;
  html_path: string | null;
  txt_path: string | null;
  raw_path: string | null;
  download_path: string | null;
  html_source_path: string | null;
};

export type WaitForMailtrapMessageOptions = {
  toEmail: string;
  subjectIncludes?: string;
  receivedAfter?: Date;
  timeoutMs?: number;
  pollIntervalMs?: number;
};

export type PocketBaseEmailLinkAction = "verify-email" | "reset-password" | "confirm-email-change";

export async function listMailtrapMessages(
  options: {
    search?: string;
    page?: number;
    lastId?: number;
  } = {}
): Promise<MailtrapMessage[]> {
  const searchParams = new URLSearchParams();

  if (options.search) {
    searchParams.set("search", options.search);
  }

  if (typeof options.page === "number") {
    searchParams.set("page", String(options.page));
  }

  if (typeof options.lastId === "number") {
    searchParams.set("last_id", String(options.lastId));
  }

  const searchValue = searchParams.toString();
  const path = searchValue
    ? `${getMailtrapMessagesPath()}?${searchValue}`
    : getMailtrapMessagesPath();

  return await requestMailtrapJson<MailtrapMessage[]>(path);
}

export async function getMailtrapMessageHtml(messageId: number): Promise<string> {
  return await requestMailtrapText(`${getMailtrapMessagesPath()}/${messageId}/body.html`);
}

export async function waitForMailtrapMessage(
  options: WaitForMailtrapMessageOptions
): Promise<MailtrapMessage> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_MAILTRAP_TIMEOUT_MS;
  const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_MAILTRAP_POLL_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    const messages = await listMailtrapMessages({
      search: options.toEmail,
    });
    const matchingMessage = messages
      .filter(function filterMatchingMessages(message) {
        return matchesMailtrapMessage(message, options);
      })
      .sort(sortMailtrapMessagesByCreatedAtDesc)[0];

    if (matchingMessage) {
      return matchingMessage;
    }

    await waitForDuration(pollIntervalMs);
  }

  throw new Error(
    `Timed out waiting for Mailtrap message for ${options.toEmail} after ${timeoutMs}ms.`
  );
}

export async function waitForPocketBaseEmailLinkPath(
  options: WaitForMailtrapMessageOptions & {
    action: PocketBaseEmailLinkAction;
  }
): Promise<string> {
  const message = await waitForMailtrapMessage(options);
  const html = await getMailtrapMessageHtml(message.id);

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
    `Unable to find PocketBase email link for action "${options.action}" in Mailtrap HTML.`
  );
}

function getMailtrapMessagesPath(): string {
  const accountId = getRequiredTestEnvNumber("PLAYWRIGHT_MAILTRAP_ACCOUNT_ID");
  const inboxId = getRequiredTestEnvNumber("PLAYWRIGHT_MAILTRAP_INBOX_ID");

  return `/api/accounts/${accountId}/inboxes/${inboxId}/messages`;
}

function matchesMailtrapMessage(
  message: MailtrapMessage,
  options: WaitForMailtrapMessageOptions
): boolean {
  if (message.to_email.toLowerCase() !== options.toEmail.trim().toLowerCase()) {
    return false;
  }

  if (
    options.subjectIncludes &&
    !message.subject.toLowerCase().includes(options.subjectIncludes.trim().toLowerCase())
  ) {
    return false;
  }

  if (options.receivedAfter && !wasMessageReceivedAfter(message, options.receivedAfter)) {
    return false;
  }

  return true;
}

function sortMailtrapMessagesByCreatedAtDesc(a: MailtrapMessage, b: MailtrapMessage): number {
  const createdAtA = Date.parse(a.created_at);
  const createdAtB = Date.parse(b.created_at);

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

function wasMessageReceivedAfter(message: MailtrapMessage, receivedAfter: Date): boolean {
  const createdAtValue = Date.parse(message.created_at);

  if (Number.isNaN(createdAtValue)) {
    return false;
  }

  return createdAtValue >= receivedAfter.getTime();
}

async function requestMailtrapJson<TResponse>(path: string): Promise<TResponse> {
  const response = await fetch(new URL(path, MAILTRAP_API_BASE_URL), {
    headers: createMailtrapHeaders(),
  });

  if (!response.ok) {
    throw await createMailtrapError(response);
  }

  return (await response.json()) as TResponse;
}

async function requestMailtrapText(path: string): Promise<string> {
  const response = await fetch(new URL(path, MAILTRAP_API_BASE_URL), {
    headers: createMailtrapHeaders(),
  });

  if (!response.ok) {
    throw await createMailtrapError(response);
  }

  return await response.text();
}

function createMailtrapHeaders(): HeadersInit {
  const apiToken = getRequiredTestEnv("PLAYWRIGHT_MAILTRAP_API_TOKEN");

  return {
    "Api-Token": apiToken,
    Authorization: `Bearer ${apiToken}`,
  };
}

async function createMailtrapError(response: Response): Promise<Error> {
  const responseBody = await response.text();

  return new Error(
    `Mailtrap request failed with status ${response.status}: ${truncateErrorBody(responseBody)}`
  );
}

function truncateErrorBody(value: string): string {
  const trimmedValue = value.trim();

  if (trimmedValue.length <= 300) {
    return trimmedValue;
  }

  return `${trimmedValue.slice(0, 297)}...`;
}

function decodeHtmlAttribute(value: string): string {
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
