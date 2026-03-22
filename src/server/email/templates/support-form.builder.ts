import type Mail from "nodemailer/lib/mailer";
import { createElement } from "react";
import { createTranslator } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { formatEmailTimestamp, getEmailMessages } from "@/server/email/email-messages";
import type { EmailTemplateResult } from "@/server/email/render-email";
import { SupportFormEmail } from "@/server/email/templates/support-form";

type BuildSupportFormEmailInput = {
  locale: AppLocale;
  email: string;
  message: string;
  submittedAt: Date;
  attachments?: Mail.Attachment[];
};

export async function buildSupportFormEmail(
  input: BuildSupportFormEmailInput
): Promise<EmailTemplateResult> {
  const messages = await getEmailMessages(input.locale);

  const t = createTranslator({
    locale: input.locale,
    messages,
    namespace: "emails.supportForm",
  });

  const tShared = createTranslator({
    locale: input.locale,
    messages,
    namespace: "emails.shared",
  });

  const attachmentCount = input.attachments?.length ?? 0;

  return {
    subject: t("subject", {
      email: input.email,
    }),
    attachments: input.attachments,
    react: createElement(SupportFormEmail, {
      locale: input.locale,
      previewText: t("previewText"),
      footerText: tShared("footerText"),
      supportLabel: tShared("supportLabel"),
      websiteLabel: tShared("websiteLabel"),
      title: t("title"),
      emailLabel: t("fields.email"),
      email: input.email,
      messageLabel: t("fields.message"),
      message: input.message,
      submittedAtLabel: t("fields.submittedAt"),
      submittedAt: formatEmailTimestamp(input.submittedAt, input.locale),
      attachmentsLabel: attachmentCount > 0 ? t("fields.attachments") : undefined,
      attachmentsSummary:
        attachmentCount > 0
          ? t("attachmentsSummary", {
              count: attachmentCount,
            })
          : undefined,
    }),
  };
}
