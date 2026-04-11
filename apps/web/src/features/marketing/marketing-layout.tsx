import clsx from "clsx";
import { Locale } from "next-intl";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { MarketingFooter } from "./marketing-footer";
import { MarketingHeader } from "./marketing-header";

export function MarketingLayout({
  children,
  headerDesktopAuthSlot,
  headerMobileTopAuthSlot,
  headerMobileViewerSlot,
  headerMobileFooterActionsSlot,
  footerAccountSection,
  skipToContentLabel,
  locale,
}: {
  children: React.ReactNode;
  headerDesktopAuthSlot: React.ReactNode;
  headerMobileTopAuthSlot: React.ReactNode;
  headerMobileViewerSlot: React.ReactNode;
  headerMobileFooterActionsSlot: React.ReactNode;
  footerAccountSection: React.ReactNode;
  skipToContentLabel: string;
  locale: Locale;
}) {
  const contentId = "gtdn-app-content";

  return (
    <div
      className={clsx(
        "[--navbar-height:--spacing(16)]",
        "relative isolate flex min-h-dvh w-full flex-col justify-between *:shrink-0 *:grow-0 *:data-[slot=main]:shrink *:data-[slot=main]:grow"
      )}
    >
      <SkipToContent href={`#${contentId}`}>{skipToContentLabel}</SkipToContent>

      <MarketingHeader
        desktopAuthSlot={headerDesktopAuthSlot}
        mobileTopAuthSlot={headerMobileTopAuthSlot}
        mobileViewerSlot={headerMobileViewerSlot}
        mobileFooterActionsSlot={headerMobileFooterActionsSlot}
        locale={locale}
      />

      <main id={contentId} data-slot="main" className="min-w-0">
        {children}
      </main>

      <MarketingFooter accountSection={footerAccountSection} locale={locale} />
    </div>
  );
}
