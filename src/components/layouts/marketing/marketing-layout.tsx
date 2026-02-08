"use client";

import clsx from "clsx";
// import { Banner, BannerDescription, BannerDivider, BannerLink, BannerTitle } from "./banner";
import { Footer } from "./footer";
import { Header } from "./header";
import { SkipToContent } from "../skip-to-content";
import { useTranslations } from "next-intl";

// Main Layout Component
export function MarketingLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("layout");
  const contentId = "gtdn-app-content";

  return (
    <div
      className={clsx(
        "[--navbar-height:--spacing(16)]",
        "relative isolate flex min-h-dvh w-full flex-col justify-between *:shrink-0 *:grow-0 *:data-[slot=main]:shrink *:data-[slot=main]:grow"
      )}
    >
      {/* Skip to content - A11y */}
      <SkipToContent href={`#${contentId}`}>{t("skipToContent")}</SkipToContent>

      {/* Banner */}
      {/*<Banner isDismissable={true}>
        <BannerTitle>{t("banner.title")}</BannerTitle>
        <BannerDivider />
        <BannerDescription>{t("banner.description")}</BannerDescription>
        <BannerLink href="/">{t("banner.callToAction")}</BannerLink>
      </Banner>*/}

      {/* Header */}
      <Header />

      {/* Main content */}
      <main id={contentId} data-slot="main" className="min-w-0">
        {children}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
}
