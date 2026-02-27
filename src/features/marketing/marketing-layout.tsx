"use client";

import clsx from "clsx";
import { MarketingFooter } from "./marketing-footer";
import { MarketingHeader } from "./marketing-header";
import { SkipToContent } from "@/components/layout/skip-to-content";
import type { UserAccountMenuViewer } from "@/features/account/user-account-menu";
import { useTranslations } from "next-intl";

// Main Layout Component
export function MarketingLayout({
  children,
  viewer,
}: {
  children: React.ReactNode;
  viewer: UserAccountMenuViewer | null;
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
      <SkipToContent href={`#${contentId}`}>{t("skipToContent")}</SkipToContent>

      {/* Banner should go here */}

      <MarketingHeader viewer={viewer} />

      <main id={contentId} data-slot="main" className="min-w-0">
        {children}
      </main>

      <MarketingFooter viewer={viewer} />
    </div>
  );
}
