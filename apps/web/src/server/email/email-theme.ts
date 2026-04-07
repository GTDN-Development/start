import { app } from "@/config/app";
import { legal } from "@/config/legal";

export const emailTheme = {
  brandName: app.site.name,
  siteUrl: app.site.url,
  supportEmail: legal.contact.support.email,
  canvasColor: "#f4f4f5",
  surfaceColor: "#ffffff",
  textColor: "#111827",
  mutedTextColor: "#6b7280",
  borderColor: "#e5e7eb",
  accentColor: "#111827",
  maxWidth: 600,
  radius: 16,
  contentPadding: "32px",
} as const;
