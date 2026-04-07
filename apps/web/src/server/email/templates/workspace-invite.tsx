import { Button, Heading, Link, Section, Text } from "@react-email/components";
import { createWorkspaceInviteUrl } from "@/server/workspaces/workspace-invite-url";
import { EmailLayout } from "@/server/email/email-layout";
import { emailTheme } from "@/server/email/email-theme";

export type WorkspaceInviteEmailProps = {
  locale: string;
  previewText: string;
  footerText: string;
  supportLabel: string;
  websiteLabel: string;
  title: string;
  description: string;
  inviterLine: string | null;
  ctaLabel: string;
  inviteUrl: string;
  urlFallbackLabel: string;
  expiryText: string;
};

export function WorkspaceInviteEmail({
  locale,
  previewText,
  footerText,
  supportLabel,
  websiteLabel,
  title,
  description,
  inviterLine,
  ctaLabel,
  inviteUrl,
  urlFallbackLabel,
  expiryText,
}: WorkspaceInviteEmailProps) {
  return (
    <EmailLayout
      locale={locale}
      previewText={previewText}
      footerText={footerText}
      supportLabel={supportLabel}
      websiteLabel={websiteLabel}
    >
      <Heading style={headingStyle}>{title}</Heading>
      <Text style={paragraphStyle}>{description}</Text>
      {inviterLine && <Text style={paragraphStyle}>{inviterLine}</Text>}
      <Section style={buttonSectionStyle}>
        <Button href={inviteUrl} style={buttonStyle}>
          {ctaLabel}
        </Button>
      </Section>
      <Text style={paragraphStyle}>{expiryText}</Text>
      <Text style={urlLabelStyle}>{urlFallbackLabel}</Text>
      <Text style={urlValueStyle}>
        <Link href={inviteUrl} style={urlLinkStyle}>
          {inviteUrl}
        </Link>
      </Text>
    </EmailLayout>
  );
}

export const PreviewProps = {
  locale: "cs",
  previewText: "Pozvánka do workspace Start Labs",
  footerText: "Potřebujete pomoc? Napište nám nebo navštivte web.",
  supportLabel: "Podpora",
  websiteLabel: "Web",
  title: "Pozvánka do workspace",
  description: "Byli jste pozváni do workspace Start Labs.",
  inviterLine: "Pozval vás Jan Novák.",
  ctaLabel: "Přijmout pozvánku",
  inviteUrl: createWorkspaceInviteUrl("demo-token", "cs"),
  urlFallbackLabel: "Pokud tlačítko nefunguje, otevřete tuto adresu:",
  expiryText: "Pozvánka vyprší za 7 dní.",
} satisfies WorkspaceInviteEmailProps;

export default WorkspaceInviteEmail;

const headingStyle = {
  margin: "0 0 16px",
  fontSize: "28px",
  lineHeight: "36px",
  color: emailTheme.textColor,
};

const paragraphStyle = {
  margin: "0 0 16px",
  fontSize: "16px",
  lineHeight: "26px",
  color: emailTheme.textColor,
};

const buttonSectionStyle = {
  margin: "24px 0",
};

const buttonStyle = {
  borderRadius: "999px",
  backgroundColor: emailTheme.accentColor,
  color: "#ffffff",
  padding: "14px 24px",
  fontSize: "16px",
  fontWeight: "700",
  textDecoration: "none",
};

const urlLabelStyle = {
  margin: "24px 0 8px",
  fontSize: "14px",
  lineHeight: "22px",
  color: emailTheme.mutedTextColor,
};

const urlValueStyle = {
  margin: "0",
  fontSize: "14px",
  lineHeight: "22px",
  wordBreak: "break-all" as const,
};

const urlLinkStyle = {
  color: emailTheme.textColor,
  textDecoration: "underline",
};
