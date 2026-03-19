import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "@/server/email/email-layout";
import {
  formDetailSectionStyle,
  formHeadingStyle,
  formLabelStyle,
  formMetaValueStyle,
  formValueMultilineStyle,
} from "@/server/email/email-styles";

export type SupportFormEmailProps = {
  locale: string;
  previewText: string;
  footerText: string;
  supportLabel: string;
  websiteLabel: string;
  title: string;
  emailLabel: string;
  email: string;
  messageLabel: string;
  message: string;
  submittedAtLabel: string;
  submittedAt: string;
  attachmentsLabel?: string;
  attachmentsSummary?: string;
};

export function SupportFormEmail({
  locale,
  previewText,
  footerText,
  supportLabel,
  websiteLabel,
  title,
  emailLabel,
  email,
  messageLabel,
  message,
  submittedAtLabel,
  submittedAt,
  attachmentsLabel,
  attachmentsSummary,
}: SupportFormEmailProps) {
  return (
    <EmailLayout
      locale={locale}
      previewText={previewText}
      footerText={footerText}
      supportLabel={supportLabel}
      websiteLabel={websiteLabel}
    >
      <Heading style={formHeadingStyle}>{title}</Heading>
      <Section style={formDetailSectionStyle}>
        <Text style={formLabelStyle}>{emailLabel}</Text>
        <Text style={formValueMultilineStyle}>{email}</Text>
      </Section>
      <Section style={formDetailSectionStyle}>
        <Text style={formLabelStyle}>{messageLabel}</Text>
        <Text style={formValueMultilineStyle}>{message}</Text>
      </Section>
      {attachmentsLabel && attachmentsSummary && (
        <Section style={formDetailSectionStyle}>
          <Text style={formLabelStyle}>{attachmentsLabel}</Text>
          <Text style={formValueMultilineStyle}>{attachmentsSummary}</Text>
        </Section>
      )}
      <Section>
        <Text style={formLabelStyle}>{submittedAtLabel}</Text>
        <Text style={formMetaValueStyle}>{submittedAt}</Text>
      </Section>
    </EmailLayout>
  );
}

export const PreviewProps = {
  locale: "cs",
  previewText: "Nová zpráva z formuláře podpory",
  footerText: "Potřebujete pomoc? Napište nám nebo navštivte web.",
  supportLabel: "Podpora",
  websiteLabel: "Web",
  title: "Nová zpráva z formuláře podpory",
  emailLabel: "E-mail",
  email: "uzivatel@example.com",
  messageLabel: "Zpráva",
  message: "Aplikace mi hlásí chybu při vytváření workspace.\nMůžete se na to prosím podívat?",
  submittedAtLabel: "Odesláno",
  submittedAt: "19. 3. 2026 14:35",
  attachmentsLabel: "Přílohy",
  attachmentsSummary: "2 přílohy",
} satisfies SupportFormEmailProps;

export default SupportFormEmail;
