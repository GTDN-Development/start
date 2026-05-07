import type { AppLocale } from "@/i18n/routing";
import { sendEmail } from "@/server/email/email-transport";
import { renderEmail } from "@/server/email/render-email";
import { buildOrganizationInviteEmail } from "@/server/email/templates/organization-invite.builder";

export async function sendOrganizationInviteEmail(input: {
  locale: AppLocale;
  email: string;
  organizationName: string;
  inviterName: string | null;
  inviteToken: string;
}): Promise<void> {
  const renderedEmail = await renderEmail(
    await buildOrganizationInviteEmail({
      locale: input.locale,
      organizationName: input.organizationName,
      inviterName: input.inviterName,
      inviteToken: input.inviteToken,
    })
  );

  await sendEmail({
    to: input.email,
    ...renderedEmail,
  });
}
