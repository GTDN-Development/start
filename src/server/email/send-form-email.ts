import nodemailer from "nodemailer";

type FormEmailMessage = {
  subject: string;
  html: string;
  text: string;
};

type EmailMessage = FormEmailMessage & {
  to: string;
};

const HTML_ESCAPE_REPLACEMENTS: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  "\"": "&quot;",
  "'": "&#39;",
};

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => HTML_ESCAPE_REPLACEMENTS[character] ?? character);
}

export async function sendFormEmail(message: FormEmailMessage) {
  const recipientEmail = process.env.FORM_RECIPIENT_EMAIL ?? "";

  await sendEmail({
    to: recipientEmail,
    ...message,
  });
}

export async function sendEmail(message: EmailMessage) {
  const transporter = getOrCreateMailTransporter();
  const fromName = process.env.MAIL_FROM_NAME ?? "";
  const fromAddress = process.env.MAIL_FROM_ADDRESS ?? "";
  const { to, ...messageContent } = message;

  await transporter.sendMail({
    from: `${fromName} <${fromAddress}>`,
    to,
    ...messageContent,
  });
}

function getOrCreateMailTransporter() {
  if (globalThis.__startMailTransporter) {
    return globalThis.__startMailTransporter;
  }

  const port = Number.parseInt(process.env.MAIL_PORT || "587", 10);

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  globalThis.__startMailTransporter = transporter;

  return transporter;
}

declare global {
  var __startMailTransporter: nodemailer.Transporter | undefined;
}
