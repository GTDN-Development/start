import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "@/server/email/email-layout";
import {
  formDetailSectionStyle,
  formHeadingStyle,
  formLabelStyle,
  formMetaValueStyle,
  formValueMultilineStyle,
} from "@/server/email/email-styles";

export type ContactFormEmailProps = {
  locale: string;
  previewText: string;
  footerText: string;
  supportLabel: string;
  websiteLabel: string;
  title: string;
  fullNameLabel: string;
  fullName: string;
  emailLabel: string;
  email: string;
  phoneLabel: string;
  phone: string;
  messageLabel: string;
  message: string;
  submittedAtLabel: string;
  submittedAt: string;
};

export function ContactFormEmail({
  locale,
  previewText,
  footerText,
  supportLabel,
  websiteLabel,
  title,
  fullNameLabel,
  fullName,
  emailLabel,
  email,
  phoneLabel,
  phone,
  messageLabel,
  message,
  submittedAtLabel,
  submittedAt,
}: ContactFormEmailProps) {
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
        <Text style={formLabelStyle}>{fullNameLabel}</Text>
        <Text style={formValueMultilineStyle}>{fullName}</Text>
      </Section>
      <Section style={formDetailSectionStyle}>
        <Text style={formLabelStyle}>{emailLabel}</Text>
        <Text style={formValueMultilineStyle}>{email}</Text>
      </Section>
      <Section style={formDetailSectionStyle}>
        <Text style={formLabelStyle}>{phoneLabel}</Text>
        <Text style={formValueMultilineStyle}>{phone}</Text>
      </Section>
      <Section style={formDetailSectionStyle}>
        <Text style={formLabelStyle}>{messageLabel}</Text>
        <Text style={formValueMultilineStyle}>{message}</Text>
      </Section>
      <Section>
        <Text style={formLabelStyle}>{submittedAtLabel}</Text>
        <Text style={formMetaValueStyle}>{submittedAt}</Text>
      </Section>
    </EmailLayout>
  );
}

export const PreviewProps = {
  locale: "cs",
  previewText: "Nová zpráva z kontaktního formuláře",
  footerText: "Potřebujete pomoc? Napište nám nebo navštivte web.",
  supportLabel: "Podpora",
  websiteLabel: "Web",
  title: "Nová zpráva z kontaktního formuláře",
  fullNameLabel: "Jméno a příjmení",
  fullName: "Jan Novák",
  emailLabel: "E-mail",
  email: "jan@example.com",
  phoneLabel: "Telefon",
  phone: "+420 777 123 456",
  messageLabel: "Zpráva",
  message: "Dobrý den,\nrád bych se dozvěděl více o možnostech pro náš tým.",
  submittedAtLabel: "Odesláno",
  submittedAt: "19. 3. 2026 14:35",
} satisfies ContactFormEmailProps;

export default ContactFormEmail;
