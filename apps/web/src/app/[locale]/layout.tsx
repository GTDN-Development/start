import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Locale, hasLocale } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { app } from "@/config/app";
import { isCookieConsentEnabled } from "@/config/cookie-consent";
import { routing } from "@/i18n/routing";
import { Toaster } from "@/components/ui/sonner";
import { TailwindScreen } from "@/components/layout/tailwind-screen";
import { AppProviders } from "@/features/application/app-providers";
import { AnalyticsScripts } from "@/features/cookies/analytics-scripts";
import { CookieConsentBanner } from "@/features/cookies/cookie-consent-banner";
import { CookieSettingsDialog } from "@/features/cookies/cookie-settings-dialog";
import { CookieErrorBoundary } from "@/features/cookies/cookie-error-boundary";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const STATIC_INTL_FORMATS = {};
const STATIC_INTL_NOW = new Date("2000-01-01T00:00:00.000Z");
const STATIC_INTL_TIME_ZONE = "UTC";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#000000" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(
  props: Omit<LayoutProps<"/[locale]">, "children">
): Promise<Metadata> {
  const { locale } = await props.params;
  const currentLocale = locale as Locale;

  const t = await getTranslations({
    locale: currentLocale,
    namespace: "layout.metadata",
  });

  return {
    title: {
      default: t("title"),
      template: `%s | ${app.site.name}`,
    },
    description: t("description"),
    metadataBase: new URL(app.site.url),
    authors: app.metadata.authors,
  };
}

export default async function RootLayout({ children, params }: LayoutProps<"/[locale]">) {
  // Ensure that the incoming `locale` is valid
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  const cookieConsentEnabled = isCookieConsentEnabled();
  const messages = await getMessages({ locale });

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`scroll-pt-16 ${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="antialiased">
        <NextIntlClientProvider
          locale={locale}
          messages={messages}
          formats={STATIC_INTL_FORMATS}
          now={STATIC_INTL_NOW}
          timeZone={STATIC_INTL_TIME_ZONE}
        >
          <AppProviders>
            <div className="relative isolate">{children}</div>
            {cookieConsentEnabled && (
              <CookieErrorBoundary>
                <CookieConsentBanner />
                <CookieSettingsDialog />
              </CookieErrorBoundary>
            )}
            <TailwindScreen />
            <Toaster />
            <AnalyticsScripts />
          </AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
