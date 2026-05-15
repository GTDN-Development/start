import { product } from "@/config/product";

export const emailTheme = {
  brandName: product.site.name,
  siteUrl: product.site.url,
  supportEmail: product.company.contact.support.email,
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
