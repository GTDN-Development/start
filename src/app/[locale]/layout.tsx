import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import { Suspense } from "react";
import { Locale, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { Toaster } from "@/components/ui/sonner";
import { AppProviders } from "@/components/providers/app-providers";
import { TailwindScreen } from "@/components/dev/tailwind-screen";
import { ThirdPartyScripts } from "@/features/cookies/third-party-scripts";
import { CookieConsentBanner } from "@/features/cookies/cookie-consent-banner";
import { CookieSettingsDialog } from "@/features/cookies/cookie-settings-dialog";
import { CookieErrorBoundary } from "@/features/cookies/cookie-error-boundary";
import {
  getConsent,
  hasInteracted as getCookieConsentHasInteracted,
} from "@/features/cookies/cookie-server-utils";
import { app } from "@/config/app";
import { defaultSocialPreviewImage, getLocalizedAlternates } from "@/lib/metadata";

const fontSans = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const fontMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

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
    alternates: getLocalizedAlternates("/", currentLocale),
    openGraph: {
      type: "website",
      siteName: app.site.name,
      title: t("title"),
      description: t("description"),
      url: getPathname({ href: "/", locale: currentLocale }),
      images: [defaultSocialPreviewImage],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [defaultSocialPreviewImage.url],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
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

  const [initialCookieConsent, initialCookieConsentInteracted] = await Promise.all([
    getConsent(),
    getCookieConsentHasInteracted(),
  ]);

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`scroll-pt-16 ${fontSans.variable} ${fontMono.variable}`}
    >
      <body className="antialiased">
        <NextIntlClientProvider>
          <AppProviders
            initialCookieConsent={initialCookieConsent}
            initialCookieConsentInteracted={initialCookieConsentInteracted}
          >
            <div className="relative isolate">{children}</div>
            <CookieErrorBoundary>
              <CookieConsentBanner />
              <CookieSettingsDialog />
            </CookieErrorBoundary>
            <TailwindScreen />
            <Toaster />
          </AppProviders>
        </NextIntlClientProvider>

        {/* Load scripts that are controlled by our cookie consent settings. */}
        <Suspense fallback={null}>
          <ThirdPartyScripts />
        </Suspense>
      </body>
    </html>
  );
}
