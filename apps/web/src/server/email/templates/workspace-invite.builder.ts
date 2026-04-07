import { createElement } from "react";
import { createTranslator } from "next-intl";
import type { AppLocale } from "@/i18n/routing";
import { workspaceConfig } from "@/config/workspace";
import { getEmailMessages } from "@/server/email/email-messages";
import type { EmailTemplateResult } from "@/server/email/render-email";
import { WorkspaceInviteEmail } from "@/server/email/templates/workspace-invite";
import { createWorkspaceInviteUrl } from "@/server/workspaces/workspace-invite-url";

type BuildWorkspaceInviteEmailInput = {
  locale: AppLocale;
  workspaceName: string;
  inviterName: string | null;
  inviteToken: string;
};

export async function buildWorkspaceInviteEmail(
  input: BuildWorkspaceInviteEmailInput
): Promise<EmailTemplateResult> {
  const messages = await getEmailMessages(input.locale);

  const t = createTranslator({
    locale: input.locale,
    messages,
    namespace: "emails.workspaceInvite",
  });

  const tShared = createTranslator({
    locale: input.locale,
    messages,
    namespace: "emails.shared",
  });

  const inviteUrl = createWorkspaceInviteUrl(input.inviteToken, input.locale);

  return {
    subject: t("subject", {
      workspaceName: input.workspaceName,
    }),
    react: createElement(WorkspaceInviteEmail, {
      locale: input.locale,
      previewText: t("previewText", {
        workspaceName: input.workspaceName,
      }),
      footerText: tShared("footerText"),
      supportLabel: tShared("supportLabel"),
      websiteLabel: tShared("websiteLabel"),
      title: t("title"),
      description: t("description", {
        workspaceName: input.workspaceName,
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
        days: workspaceConfig.invites.ttlDays,
      }),
    }),
  };
}
