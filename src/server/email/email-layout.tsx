import type { PropsWithChildren } from "react";
import {
  Body,
  Container,
  Head,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { emailTheme } from "@/server/email/email-theme";

type EmailLayoutProps = PropsWithChildren<{
  locale: string;
  previewText: string;
  footerText: string;
  supportLabel: string;
  websiteLabel: string;
}>;

export function EmailLayout({
  children,
  locale,
  previewText,
  footerText,
  supportLabel,
  websiteLabel,
}: EmailLayoutProps) {
  return (
    <Html lang={locale}>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Section style={cardStyle}>
            <Section style={logoSectionStyle}>
              <Link href={emailTheme.siteUrl} style={logoLinkStyle}>
                <Img
                  src={getEmailLogoUrl()}
                  alt={emailTheme.brandName}
                  width="150"
                  height="40"
                  style={logoStyle}
                />
              </Link>
            </Section>
            {children}
            <Hr style={dividerStyle} />
            <Text style={footerTextStyle}>{footerText}</Text>
            <Text style={footerLinkTextStyle}>
              {supportLabel}:{" "}
              <Link href={`mailto:${emailTheme.supportEmail}`} style={footerLinkStyle}>
                {emailTheme.supportEmail}
              </Link>
            </Text>
            <Text style={footerLinkTextStyle}>
              {websiteLabel}:{" "}
              <Link href={emailTheme.siteUrl} style={footerLinkStyle}>
                {emailTheme.siteUrl}
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

const bodyStyle = {
  margin: "0",
  backgroundColor: emailTheme.canvasColor,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif',
  color: emailTheme.textColor,
};

const containerStyle = {
  width: "100%",
  maxWidth: `${emailTheme.maxWidth}px`,
  margin: "0 auto",
  padding: "24px 12px",
};

const cardStyle = {
  backgroundColor: emailTheme.surfaceColor,
  border: `1px solid ${emailTheme.borderColor}`,
  borderRadius: `${emailTheme.radius}px`,
  padding: emailTheme.contentPadding,
};

const logoSectionStyle = {
  marginBottom: "24px",
};

const logoLinkStyle = {
  display: "inline-block",
};

const logoStyle = {
  display: "block",
  width: "150px",
  height: "40px",
};

const dividerStyle = {
  margin: "32px 0 24px",
  borderColor: emailTheme.borderColor,
};

const footerTextStyle = {
  margin: "0 0 12px",
  fontSize: "14px",
  lineHeight: "22px",
  color: emailTheme.mutedTextColor,
};

const footerLinkTextStyle = {
  margin: "0 0 8px",
  fontSize: "14px",
  lineHeight: "22px",
  color: emailTheme.mutedTextColor,
};

const footerLinkStyle = {
  color: emailTheme.textColor,
  textDecoration: "underline",
};

function getEmailLogoUrl() {
  const normalizedSiteUrl = emailTheme.siteUrl.replace(/\/+$/g, "");

  return `${normalizedSiteUrl}/email/start-logo-email.png`;
}
