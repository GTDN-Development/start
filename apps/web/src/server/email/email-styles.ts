import { emailTheme } from "@/server/email/email-theme";

export const formHeadingStyle = {
  margin: "0 0 24px",
  fontSize: "28px",
  lineHeight: "36px",
  color: emailTheme.textColor,
};

export const formDetailSectionStyle = {
  marginBottom: "20px",
};

export const formLabelStyle = {
  margin: "0 0 6px",
  fontSize: "13px",
  lineHeight: "20px",
  fontWeight: "700",
  color: emailTheme.mutedTextColor,
  textTransform: "uppercase" as const,
  letterSpacing: "0.04em",
};

export const formValueStyle = {
  margin: "0",
  fontSize: "16px",
  lineHeight: "26px",
  color: emailTheme.textColor,
};

export const formValueMultilineStyle = {
  ...formValueStyle,
  whiteSpace: "pre-line" as const,
};

export const formMetaValueStyle = {
  margin: "0",
  fontSize: "15px",
  lineHeight: "24px",
  color: emailTheme.textColor,
};
