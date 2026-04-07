import type { AppLocale } from "@/i18n/routing";
import { sendEmail } from "@/server/email/email-transport";
import { renderEmail } from "@/server/email/render-email";
import { buildWorkspaceInviteEmail } from "@/server/email/templates/workspace-invite.builder";

export async function sendWorkspaceInviteEmail(input: {
  locale: AppLocale;
  email: string;
  workspaceName: string;
  inviterName: string | null;
  inviteToken: string;
}): Promise<void> {
  const renderedEmail = await renderEmail(
    await buildWorkspaceInviteEmail({
      locale: input.locale,
      workspaceName: input.workspaceName,
      inviterName: input.inviterName,
      inviteToken: input.inviteToken,
    })
  );

  await sendEmail({
    to: input.email,
    ...renderedEmail,
  });
}
