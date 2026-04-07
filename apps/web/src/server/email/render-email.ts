import type Mail from "nodemailer/lib/mailer";
import type { ReactElement } from "react";
import { render, toPlainText } from "@react-email/render";

export type EmailTemplateResult = {
  subject: string;
  react: ReactElement;
  text?: string;
  replyTo?: Mail.Options["replyTo"];
  attachments?: Mail.Attachment[];
};

type RenderedEmail = {
  subject: string;
  html: string;
  text: string;
  replyTo?: Mail.Options["replyTo"];
  attachments?: Mail.Attachment[];
};

export async function renderEmail(template: EmailTemplateResult): Promise<RenderedEmail> {
  const html = await render(template.react, {
    pretty: true,
  });

  return {
    subject: template.subject,
    html,
    text: template.text ?? toPlainText(html),
    replyTo: template.replyTo,
    attachments: template.attachments,
  };
}
