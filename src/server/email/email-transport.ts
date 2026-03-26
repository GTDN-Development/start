import nodemailer from "nodemailer";
import type Mail from "nodemailer/lib/mailer";

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
  const recipientEmail = process.env.GENERAL_FORMS_RECIPIENT ?? "";

  await sendEmail({
    to: recipientEmail,
    ...message,
  });
}

export async function sendEmail(message: EmailMessage) {
  const transporter = getOrCreateMailTransporter();
  const fromName = process.env.MAIL_FROM_NAME?.trim() ?? "";
  const fromAddress = process.env.MAIL_FROM_ADDRESS?.trim() ?? "";

  const { to, ...messageContent } = message;

  await transporter.sendMail({
    from: fromName ? `${fromName} <${fromAddress}>` : fromAddress,
    to,
    ...messageContent,
  });
}

function getOrCreateMailTransporter() {
  if (globalThis.__startMailTransporter) {
    return globalThis.__startMailTransporter;
  }

  const port = Number.parseInt(process.env.MAIL_PORT || "587", 10);
  const secure = getMailTransportSecureValue(port);

  const transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port,
    secure,
    auth: {
      user: process.env.MAIL_USERNAME,
      pass: process.env.MAIL_PASSWORD,
    },
  });

  globalThis.__startMailTransporter = transporter;

  return transporter;
}

function getMailTransportSecureValue(port: number) {
  const secureValue = process.env.EMAIL_SECURE?.trim().toLowerCase();

  if (secureValue === "true") {
    return true;
  }

  if (secureValue === "false") {
    return false;
  }

  return port === 465;
}

declare global {
  var __startMailTransporter: nodemailer.Transporter | undefined;
}
