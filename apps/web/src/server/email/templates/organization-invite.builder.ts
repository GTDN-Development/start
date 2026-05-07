import { createElement } from "react";
import { createTranslator } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { organizationConfig } from "@/config/organization";
import { getEmailMessages } from "@/server/email/email-messages";
import type { EmailTemplateResult } from "@/server/email/render-email";
import { OrganizationInviteEmail } from "@/server/email/templates/organization-invite";
import { createOrganizationInviteUrl } from "@/server/organizations/organization-invite-url";

type BuildOrganizationInviteEmailInput = {
  locale: AppLocale;
  organizationName: string;
  inviterName: string | null;
  inviteToken: string;
};

export async function buildOrganizationInviteEmail(
  input: BuildOrganizationInviteEmailInput
): Promise<EmailTemplateResult> {
  const messages = await getEmailMessages(input.locale);

  const t = createTranslator({
    locale: input.locale,
    messages,
    namespace: "emails.organizationInvite",
  });

  const tShared = createTranslator({
    locale: input.locale,
    messages,
    namespace: "emails.shared",
  });

  const inviteUrl = createOrganizationInviteUrl(input.inviteToken, input.locale);

  return {
    subject: t("subject", {
      organizationName: input.organizationName,
    }),
    react: createElement(OrganizationInviteEmail, {
      locale: input.locale,
      previewText: t("previewText", {
        organizationName: input.organizationName,
      }),
      footerText: tShared("footerText"),
      supportLabel: tShared("supportLabel"),
      websiteLabel: tShared("websiteLabel"),
      title: t("title"),
      description: t("description", {
        organizationName: input.organizationName,
      }),
      inviterLine: input.inviterName
        ? t("invitedBy", {
            inviterName: input.inviterName,
          })
        : t("invitedWithoutInviter"),
      ctaLabel: t("ctaLabel"),
      inviteUrl,
      urlFallbackLabel: t("urlFallbackLabel"),
      expiryText: t("expiryText", {
        days: organizationConfig.invites.ttlDays,
      }),
    }),
  };
}
