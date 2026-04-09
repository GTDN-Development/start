import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getMailpitMessage,
  getMailpitMessageHtml,
  waitForMailpitMessage,
} from "../e2e/helpers/mailpit";

describe("mailpit helper", function describeMailpitHelper() {
  const originalEnv = process.env;

  beforeEach(function resetEnvironment() {
    process.env = {
      ...originalEnv,
      MAILPIT_BASE_URL: "https://mailpit.example.com",
    };
    vi.useFakeTimers();
  });

  afterEach(function restoreEnvironment() {
    process.env = originalEnv;
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("waits for a message using Mailpit search API", async function testWaitForMessage() {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            messages: [],
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            messages: [
              {
                ID: "message-1",
                Subject: "Verify your account",
                To: [
                  {
                    Address: "user@example.com",
                  },
                ],
                Created: "2026-04-08T08:00:05.000Z",
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

    const messagePromise = waitForMailpitMessage({
      toEmail: "user@example.com",
      subjectIncludes: "Verify your account",
      receivedAfter: new Date("2026-04-08T08:00:00.000Z"),
      timeoutMs: 1_000,
      pollIntervalMs: 100,
    });

    await vi.advanceTimersByTimeAsync(100);

    await expect(messagePromise).resolves.toMatchObject({
      ID: "message-1",
      Subject: "Verify your account",
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0]?.[0])).toContain("/api/v1/search?query=");
    expect(fetchMock.mock.calls[0]?.[1]).toBeUndefined();
  });

  it("fetches Mailpit message metadata and rendered html", async function testReadMessage() {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            ID: "message-1",
            Subject: "Workspace invite",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
            },
          }
        )
      )
      .mockResolvedValueOnce(new Response('<a href="/accept">Accept</a>', { status: 200 }));

    vi.stubGlobal("fetch", fetchMock);

    await expect(getMailpitMessage("message-1")).resolves.toMatchObject({
      ID: "message-1",
      Subject: "Workspace invite",
    });
    await expect(getMailpitMessageHtml("message-1")).resolves.toBe('<a href="/accept">Accept</a>');

    expect(String(fetchMock.mock.calls[0]?.[0])).toBe(
      "https://mailpit.example.com/api/v1/message/message-1"
    );
    expect(String(fetchMock.mock.calls[1]?.[0])).toBe(
      "https://mailpit.example.com/view/message-1.html"
    );
  });
});
