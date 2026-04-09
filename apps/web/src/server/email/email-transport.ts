import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";
import {
  formatMailSender,
  getFormEmailRecipient,
  getMailTransportConfig,
  type MailpitApiMailTransportConfig,
  type SmtpMailTransportConfig,
} from "./email-env";

type BaseEmailMessage = {
  subject: string;
  html: string;
  text: string;
  replyTo?: Mail.Options["replyTo"];
  attachments?: Mail.Attachment[];
};

type EmailMessage = BaseEmailMessage & {
  to: Mail.Options["to"];
};

export async function sendFormEmail(message: BaseEmailMessage) {
  await sendEmail({
    to: getFormEmailRecipient(),
    ...message,
  });
}

export async function sendEmail(message: EmailMessage) {
  const transport = getMailTransportConfig();

  if (transport.mode === "mailpit-api") {
    await sendMailpitApiEmail({
      transport,
      message,
    });

    return;
  }

  const transporter = getOrCreateMailTransporter(transport);
  const { to, ...messageContent } = message;

  await transporter.sendMail({
    from: formatMailSender(transport.sender),
    to,
    ...messageContent,
  });
}

function getOrCreateMailTransporter(transport: SmtpMailTransportConfig) {
  if (globalThis.__startMailTransporter) {
    return globalThis.__startMailTransporter;
  }

  const transporter = nodemailer.createTransport({
    host: transport.host,
    port: transport.port,
    secure: transport.secure,
    auth: {
      user: transport.auth.user,
      pass: transport.auth.pass,
    },
  });

  globalThis.__startMailTransporter = transporter;

  return transporter;
}

async function sendMailpitApiEmail(options: {
  transport: MailpitApiMailTransportConfig;
  message: EmailMessage;
}) {
  const response = await fetch(new URL("/api/v1/send", `${options.transport.baseUrl}/`), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: options.transport.authorizationHeader,
    },
    body: JSON.stringify(createMailpitSendRequest(options)),
  });

  if (!response.ok) {
    throw await createMailpitApiError(response);
  }
}

function createMailpitSendRequest(options: {
  transport: MailpitApiMailTransportConfig;
  message: EmailMessage;
}) {
  const request: {
    From: MailpitAddress;
    To: MailpitAddress[];
    Subject: string;
    Text: string;
    HTML: string;
    ReplyTo?: MailpitAddress[];
    Attachments?: MailpitAttachment[];
  } = {
    From: createMailpitAddress(options.transport.sender.address, options.transport.sender.name),
    To: normalizeMailpitAddresses(options.message.to, "to"),
    Subject: options.message.subject,
    Text: options.message.text,
    HTML: options.message.html,
  };

  const replyTo = normalizeMailpitAddresses(options.message.replyTo, "replyTo");

  if (replyTo.length > 0) {
    request.ReplyTo = replyTo;
  }

  const attachments = normalizeMailpitAttachments(options.message.attachments);

  if (attachments.length > 0) {
    request.Attachments = attachments;
  }

  return request;
}

function normalizeMailpitAddresses(
  value: Mail.Options["to"] | Mail.Options["replyTo"] | undefined,
  fieldName: "to" | "replyTo"
): MailpitAddress[] {
  if (!value) {
    return [];
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map(function mapAddressString(part) {
        return part.trim();
      })
      .filter(Boolean)
      .map(function normalizeAddressString(part) {
        const addressMatch = part.match(/^(.*)<([^>]+)>$/);

        if (addressMatch) {
          const name = addressMatch[1]?.trim().replace(/^"|"$/g, "");
          const address = addressMatch[2]?.trim() ?? "";

          return createMailpitAddress(address, name);
        }

        return createMailpitAddress(part);
      });
  }

  if (Array.isArray(value)) {
    return value.flatMap(function normalizeMailpitAddressArrayEntry(entry) {
      return normalizeMailpitAddresses(entry, fieldName);
    });
  }

  if (typeof value === "object") {
    const address = typeof value.address === "string" ? value.address.trim() : "";
    const name = typeof value.name === "string" ? value.name.trim() : undefined;

    if (!address) {
      throw new Error(`Mailpit ${fieldName} address is missing an email address.`);
    }

    return [createMailpitAddress(address, name)];
  }

  throw new Error(`Unsupported Mailpit ${fieldName} address value.`);
}

function normalizeMailpitAttachments(
  attachments: Mail.Attachment[] | undefined
): MailpitAttachment[] {
  if (!attachments || attachments.length === 0) {
    return [];
  }

  return attachments.map(function normalizeMailpitAttachment(attachment) {
    const filename = typeof attachment.filename === "string" ? attachment.filename.trim() : "";

    if (!filename) {
      throw new Error("Mailpit attachments require a filename.");
    }

    const content = normalizeMailpitAttachmentContent(attachment.content, filename);
    const normalizedAttachment: MailpitAttachment = {
      Filename: filename,
      Content: content,
    };

    if (attachment.contentType?.trim()) {
      normalizedAttachment.ContentType = attachment.contentType.trim();
    }

    if (attachment.cid?.trim()) {
      normalizedAttachment.ContentID = attachment.cid.trim();
    }

    return normalizedAttachment;
  });
}

function normalizeMailpitAttachmentContent(
  content: Mail.Attachment["content"],
  filename: string
): string {
  if (Buffer.isBuffer(content)) {
    return content.toString("base64");
  }

  if (typeof content === "string") {
    return Buffer.from(content, "utf8").toString("base64");
  }

  if (content instanceof Uint8Array) {
    return Buffer.from(content).toString("base64");
  }

  throw new Error(
    `Unsupported Mailpit attachment content for "${filename}". Use a string, Buffer, or Uint8Array.`
  );
}

function createMailpitAddress(address: string, name?: string): MailpitAddress {
  const normalizedAddress = address.trim();

  if (!normalizedAddress) {
    throw new Error("Mailpit addresses require a non-empty email address.");
  }

  if (name?.trim()) {
    return {
      Email: normalizedAddress,
      Name: name.trim(),
    };
  }

  return {
    Email: normalizedAddress,
  };
}

async function createMailpitApiError(response: Response): Promise<Error> {
  const responseBody = await response.text();
  const normalizedResponseBody = responseBody.trim();

  return new Error(
    `Mailpit Send API request failed with status ${response.status}: ${normalizedResponseBody || "empty response body"}`
  );
}

type MailpitAddress = {
  Email: string;
  Name?: string;
};

type MailpitAttachment = {
  Filename: string;
  Content: string;
  ContentType?: string;
  ContentID?: string;
};

declare global {
  var __startMailTransporter: nodemailer.Transporter | undefined;
}
