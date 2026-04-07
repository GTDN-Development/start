import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getMailpitMessage, getMailpitMessageHtml, waitForMailpitMessage } from "./mailpit";

describe("mailpit helper", function describeMailpitHelper() {
  const originalEnv = process.env;

  beforeEach(function resetEnvironment() {
    process.env = {
      ...originalEnv,
      MAILPIT_BASE_URL: "https://mailpit.example.com",
      MAILPIT_UI_USERNAME: "ui-user",
      MAILPIT_UI_PASSWORD: "ui-pass",
    };
    vi.restoreAllMocks();
  });

  afterEach(function restoreEnvironment() {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("waits for a matching Mailpit message through the search API", async function testWait() {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          messages: [
            {
              ID: "msg-1",
              Subject: "Workspace UI Invite",
              Created: "2026-04-07T10:00:00Z",
              To: [{ Address: "invitee@example.com", Name: "Invitee" }],
            },
          ],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const message = await waitForMailpitMessage({
      toEmail: "invitee@example.com",
      subjectIncludes: "Workspace UI Invite",
      receivedAfter: new Date("2026-04-07T09:59:00Z"),
      timeoutMs: 10,
      pollIntervalMs: 1,
    });

    expect(message.ID).toBe("msg-1");

    const [url, init] = fetchMock.mock.calls[0] ?? [];

    expect(String(url)).toBe(
      "https://mailpit.example.com/api/v1/search?query=to%3Ainvitee%40example.com+subject%3A%22Workspace+UI+Invite%22&limit=50"
    );
    expect(init?.headers).toMatchObject({
      Authorization: `Basic ${Buffer.from("ui-user:ui-pass").toString("base64")}`,
    });
  });

  it("fetches Mailpit message metadata from the official API", async function testGetMessage() {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ID: "msg-2",
          Subject: "Verification email",
          To: [{ Address: "user@example.com" }],
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
          },
        }
      )
    );

    vi.stubGlobal("fetch", fetchMock);

    const message = await getMailpitMessage("msg-2");

    expect(message).toMatchObject({
      ID: "msg-2",
      Subject: "Verification email",
    });
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://mailpit.example.com/api/v1/message/msg-2"
    );
  });

  it("fetches rendered HTML through the official view endpoint", async function testGetHtml() {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('<a href="/api/pocketbase/email-link?action=verify-email&token=123">Open</a>', {
        status: 200,
        headers: {
          "Content-Type": "text/html",
        },
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    const html = await getMailpitMessageHtml("msg-3");

    expect(html).toContain("verify-email");
    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://mailpit.example.com/view/msg-3.html"
    );
  });
});
