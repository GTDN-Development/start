import { app } from "@/config/app";
import { escapeHtml, sendEmail } from "@/server/email/send-form-email";
import { INVITE_TTL_DAYS } from "@/server/workspaces/workspace-constants";

export async function sendWorkspaceInviteEmail(input: {
  email: string;
  workspaceName: string;
  inviterName: string | null;
  inviteToken: string;
}): Promise<void> {
  const inviteUrl = createWorkspaceInviteUrl(input.inviteToken);
  const safeWorkspaceName = escapeHtml(input.workspaceName);
  const inviterLine = input.inviterName
    ? `Invited by ${escapeHtml(input.inviterName)}`
    : "You were invited";

  await sendEmail({
    to: input.email,
    subject: `Invitation to ${input.workspaceName}`,
    html: `
      <h2>Workspace invitation</h2>
      <p>${inviterLine} to join <strong>${safeWorkspaceName}</strong>.</p>
      <p><a href="${escapeHtml(inviteUrl)}">Accept invitation</a></p>
      <p>This invite expires in ${INVITE_TTL_DAYS} days.</p>
    `,
    text: [
      "Workspace invitation",
      "",
      `${inviterLine} to join ${input.workspaceName}.`,
      "",
      `Accept invitation: ${inviteUrl}`,
      "",
      `This invite expires in ${INVITE_TTL_DAYS} days.`,
    ].join("\n"),
  });
}

export function createWorkspaceInviteUrl(inviteToken: string): string {
  const baseUrl = getWorkspaceInviteBaseUrl().replace(/\/+$/g, "");
  const encodedToken = encodeURIComponent(inviteToken);

  return `${baseUrl}/invite/${encodedToken}`;
}

export function getWorkspaceInviteBaseUrl(): string {
  const explicitUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (explicitUrl) {
    return explicitUrl;
  }

  return app.site.url;
}
