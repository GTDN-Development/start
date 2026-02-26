"use client";

import clsx from "clsx";
import { Footer } from "./footer";
import { Header } from "./header";
import { SkipToContent } from "@/components/shared/layout/skip-to-content";
import { useTranslations } from "next-intl";

type MarketingLayoutViewer = {
  email: string;
  name: string | null;
  verified: boolean;
} | null;

// Main Layout Component
export function MarketingLayout({
  children,
  viewer,
}: {
  children: React.ReactNode;
  viewer: MarketingLayoutViewer;
}) {
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

      {/* Potential banner goes here */}

      {/* Header */}
      <Header viewer={viewer} />

      {/* Main content */}
      <main id={contentId} data-slot="main" className="min-w-0">
        {children}
      </main>

      {/* Footer */}
      <Footer viewer={viewer} />
    </div>
  );
}
