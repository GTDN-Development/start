import { createElement } from "react";
import { createTranslator } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { formatEmailTimestamp, getEmailMessages } from "@/server/email/email-messages";
import type { EmailTemplateResult } from "@/server/email/render-email";
import { ContactFormEmail } from "@/server/email/templates/contact-form";

type BuildContactFormEmailInput = {
  locale: AppLocale;
  fullName: string;
  email: string;
  phone: string;
  message: string;
  submittedAt: Date;
};

export async function buildContactFormEmail(
  input: BuildContactFormEmailInput
): Promise<EmailTemplateResult> {
  const messages = await getEmailMessages(input.locale);

  const t = createTranslator({
    locale: input.locale,
    messages,
    namespace: "emails.contactForm",
  });

  const tShared = createTranslator({
    locale: input.locale,
    messages,
    namespace: "emails.shared",
  });

  return {
    subject: t("subject", {
      fullName: input.fullName,
    }),
    replyTo: input.email,
    react: createElement(ContactFormEmail, {
      locale: input.locale,
      previewText: t("previewText"),
      footerText: tShared("footerText"),
      supportLabel: tShared("supportLabel"),
      websiteLabel: tShared("websiteLabel"),
      title: t("title"),
      fullNameLabel: t("fields.fullName"),
      fullName: input.fullName,
      emailLabel: t("fields.email"),
      email: input.email,
      phoneLabel: t("fields.phone"),
      phone: input.phone,
      messageLabel: t("fields.message"),
      message: input.message,
      submittedAtLabel: t("fields.submittedAt"),
      submittedAt: formatEmailTimestamp(input.submittedAt, input.locale),
    }),
  };
}
