import { Heading, Section, Text } from "@react-email/components";
import { EmailLayout } from "@/server/email/email-layout";
import {
  formDetailSectionStyle,
  formHeadingStyle,
  formLabelStyle,
  formMetaValueStyle,
  formValueStyle,
} from "@/server/email/email-styles";

export type NewsletterSignupEmailProps = {
  locale: string;
  previewText: string;
  footerText: string;
  supportLabel: string;
  websiteLabel: string;
  title: string;
  emailLabel: string;
  email: string;
  subscribedAtLabel: string;
  subscribedAt: string;
};

export function NewsletterSignupEmail({
  locale,
  previewText,
  footerText,
  supportLabel,
  websiteLabel,
  title,
  emailLabel,
  email,
  subscribedAtLabel,
  subscribedAt,
}: NewsletterSignupEmailProps) {
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
        <Text style={formValueStyle}>{email}</Text>
      </Section>
      <Section>
        <Text style={formLabelStyle}>{subscribedAtLabel}</Text>
        <Text style={formMetaValueStyle}>{subscribedAt}</Text>
      </Section>
    </EmailLayout>
  );
}

export const PreviewProps = {
  locale: "cs",
  previewText: "Nové přihlášení k newsletteru",
  footerText: "Potřebujete pomoc? Napište nám nebo navštivte web.",
  supportLabel: "Podpora",
  websiteLabel: "Web",
  title: "Nové přihlášení k newsletteru",
  emailLabel: "E-mail",
  email: "subscriber@example.com",
  subscribedAtLabel: "Přihlášeno",
  subscribedAt: "19. 3. 2026 14:35",
} satisfies NewsletterSignupEmailProps;

export default NewsletterSignupEmail;
