import "@/styles/globals.css";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { Locale, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "@/components/layouts/providers";
import { LayoutCentered } from "@/components/layouts/layout-centered";
import { ThirdPartyScripts } from "@/components/(shared)/cookies/third-party-scripts";
import { DynamicScripts } from "@/components/(shared)/cookies/dynamic-scripts";
import { CookieConsentBanner } from "@/components/(shared)/cookies/cookie-consent-banner";
import { CookieSettingsDialog } from "@/components/(shared)/cookies/cookie-settings-dialog";
import { CookieErrorBoundary } from "@/components/(shared)/cookies/cookie-error-boundary";

import { site } from "@/config/site";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
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

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.metadata",
  });

  return {
    title: {
      default: t("title"),
      template: `%s | ${site.name}`,
    },
    description: t("description"),
    metadataBase: new URL(site.url),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      type: "website",
      siteName: site.name,
      title: t("title"),
      description: t("description"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
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
    authors: [{ name: "gtdn.online", url: "https://www.gtdn.online" }],
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

  return (
    <html
      lang={locale}
      suppressHydrationWarning
      className={`scroll-pt-16 scroll-smooth ${geistSans.variable} ${geistMono.variable}`}
    >
      <body className="font-sans antialiased">
        <NextIntlClientProvider>
          <Providers>
            <div className="relative isolate">
              <LayoutCentered>{children}</LayoutCentered>
            </div>
            <CookieErrorBoundary>
              <CookieConsentBanner />
              <CookieSettingsDialog />
              <DynamicScripts />
            </CookieErrorBoundary>
            <TailwindScreen />
            <Toaster />
          </Providers>
        </NextIntlClientProvider>

        {/* Load scripts that are controlled by our cookie consent settings. */}
        <Suspense fallback={null}>
          <ThirdPartyScripts />
        </Suspense>
      </body>
    </html>
  );
}

function TailwindScreen() {
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-16 left-5 z-99999 flex size-9 items-center justify-center rounded-full bg-[#282828] text-xs font-bold text-white uppercase inset-ring-1 inset-ring-current/15 dark:bg-black">
      <div className="sm:hidden">-</div>
      <div className="hidden sm:block md:hidden">sm</div>
      <div className="hidden md:block lg:hidden">md</div>
      <div className="hidden lg:block xl:hidden">lg</div>
      <div className="hidden xl:block 2xl:hidden">xl</div>
      <div className="hidden 2xl:block">2xl</div>
    </div>
  );
}
