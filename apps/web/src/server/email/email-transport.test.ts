import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { sendEmail } from "./email-transport";

const { sendMailMock, createTransportMock } = vi.hoisted(function createTransportMocks() {
  const sendMailMock = vi.fn();
  const createTransportMock = vi.fn(function createTransportMockImpl() {
    return {
      sendMail: sendMailMock,
    };
  });

  return {
    sendMailMock,
    createTransportMock,
  };
});

vi.mock("nodemailer", function mockNodemailer() {
  return {
    default: {
      createTransport: createTransportMock,
    },
  };
});

describe("email-transport", function describeEmailTransport() {
  const originalEnv = process.env;

  beforeEach(function resetEnvironment() {
    process.env = { ...originalEnv };
    delete globalThis.__startMailTransporter;
    createTransportMock.mockReset();
    sendMailMock.mockReset();
    vi.restoreAllMocks();
  });

  afterEach(function restoreEnvironment() {
    process.env = originalEnv;
    delete globalThis.__startMailTransporter;
  });

  it("sends Mailpit API payload when MAIL_TRANSPORT=mailpit-api", async function testMailpitApi() {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ID: "message-1" }), {
        status: 200,
        headers: {
          "Content-Type": "application/json",
        },
      })
    );

    vi.stubGlobal("fetch", fetchMock);

    process.env.MAIL_TRANSPORT = "mailpit-api";
    process.env.MAIL_FROM_NAME = "Support";
    process.env.MAIL_FROM_ADDRESS = "support@example.com";
    process.env.MAILPIT_BASE_URL = "https://mailpit.example.com";

    await sendEmail({
      to: "Invitee <invitee@example.com>",
      subject: "Workspace invite",
      text: "Plain text body",
      html: "<p>HTML body</p>",
      replyTo: "help@example.com",
      attachments: [
        {
          filename: "hello.txt",
          content: Buffer.from("hello", "utf8"),
          contentType: "text/plain",
        },
      ],
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(createTransportMock).not.toHaveBeenCalled();

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    const requestBody = JSON.parse(String(init?.body));

    expect(String(url)).toBe("https://mailpit.example.com/api/v1/send");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      "Content-Type": "application/json",
    });
    expect(requestBody).toEqual({
      From: {
        Email: "support@example.com",
        Name: "Support",
      },
      To: [
        {
          Email: "invitee@example.com",
          Name: "Invitee",
        },
      ],
      ReplyTo: [
        {
          Email: "help@example.com",
        },
      ],
      Subject: "Workspace invite",
      Text: "Plain text body",
      HTML: "<p>HTML body</p>",
      Attachments: [
        {
          Filename: "hello.txt",
          Content: Buffer.from("hello", "utf8").toString("base64"),
          ContentType: "text/plain",
        },
      ],
    });
  });

  it("uses SMTP transport by default", async function testSmtpTransport() {
    sendMailMock.mockResolvedValue(undefined);

    delete process.env.MAIL_TRANSPORT;
    process.env.MAIL_HOST = "smtp.example.com";
    process.env.MAIL_PORT = "2525";
    process.env.EMAIL_SECURE = "false";
    process.env.MAIL_USERNAME = "smtp-user";
    process.env.MAIL_PASSWORD = "smtp-pass";
    process.env.MAIL_FROM_NAME = "Support";
    process.env.MAIL_FROM_ADDRESS = "support@example.com";

    await sendEmail({
      to: "invitee@example.com",
      subject: "Hello",
      text: "Plain text",
      html: "<p>Hello</p>",
    });

    expect(createTransportMock).toHaveBeenCalledWith({
      host: "smtp.example.com",
      port: 2525,
      secure: false,
      auth: {
        user: "smtp-user",
        pass: "smtp-pass",
      },
    });
    expect(sendMailMock).toHaveBeenCalledWith({
      from: "Support <support@example.com>",
      to: "invitee@example.com",
      subject: "Hello",
      text: "Plain text",
      html: "<p>Hello</p>",
    });
  });
});
