import { createElement } from "react";
import { createTranslator } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { formatEmailTimestamp, getEmailMessages } from "@/server/email/email-messages";
import type { EmailTemplateResult } from "@/server/email/render-email";
import { NewsletterSignupEmail } from "@/server/email/templates/newsletter-signup";

type BuildNewsletterSignupEmailInput = {
  locale: AppLocale;
  email: string;
  subscribedAt: Date;
};

export async function buildNewsletterSignupEmail(
  input: BuildNewsletterSignupEmailInput
): Promise<EmailTemplateResult> {
  const messages = await getEmailMessages(input.locale);

  const t = createTranslator({
    locale: input.locale,
    messages,
    namespace: "emails.newsletterSignup",
  });

  const tShared = createTranslator({
    locale: input.locale,
    messages,
    namespace: "emails.shared",
  });

  return {
    subject: t("subject", {
      email: input.email,
    }),
    react: createElement(NewsletterSignupEmail, {
      locale: input.locale,
      previewText: t("previewText"),
      footerText: tShared("footerText"),
      supportLabel: tShared("supportLabel"),
      websiteLabel: tShared("websiteLabel"),
      title: t("title"),
      emailLabel: t("fields.email"),
      email: input.email,
      subscribedAtLabel: t("fields.subscribedAt"),
      subscribedAt: formatEmailTimestamp(input.subscribedAt, input.locale),
    }),
  };
}
