import { Suspense } from "react";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { MarketingLayout } from "@/features/marketing/marketing-layout";
import {
  MarketingFooterAccountSectionSkeleton,
  MarketingFooterAccountSectionSlot,
  MarketingHeaderDesktopAuthSkeleton,
  MarketingHeaderDesktopAuthSlot,
  MarketingHeaderMobileFooterActionsSkeleton,
  MarketingHeaderMobileFooterActionsSlot,
  MarketingHeaderMobileTopAuthSlot,
  MarketingHeaderMobileViewerSkeleton,
  MarketingHeaderMobileViewerSlot,
} from "@/features/marketing/marketing-auth-slots";

type MarketingRouteLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function Layout({ children, params }: MarketingRouteLayoutProps) {
  const { locale } = await params;
  const copy = await getMarketingLayoutCopy(locale as Locale);

  return (
    <MarketingLayout
      skipToContentLabel={copy.skipToContent}
      locale={locale as Locale}
      headerDesktopAuthSlot={
        <Suspense fallback={<MarketingHeaderDesktopAuthSkeleton />}>
          <MarketingHeaderDesktopAuthSlot />
        </Suspense>
      }
      headerMobileTopAuthSlot={
        <Suspense fallback={null}>
          <MarketingHeaderMobileTopAuthSlot />
        </Suspense>
      }
      headerMobileViewerSlot={
        <Suspense fallback={<MarketingHeaderMobileViewerSkeleton />}>
          <MarketingHeaderMobileViewerSlot />
        </Suspense>
      }
      headerMobileFooterActionsSlot={
        <Suspense fallback={<MarketingHeaderMobileFooterActionsSkeleton />}>
          <MarketingHeaderMobileFooterActionsSlot />
        </Suspense>
      }
      footerAccountSection={
        <Suspense fallback={<MarketingFooterAccountSectionSkeleton />}>
          <MarketingFooterAccountSectionSlot locale={locale as Locale} />
        </Suspense>
      }
    >
      {children}
    </MarketingLayout>
  );
}

async function getMarketingLayoutCopy(locale: Locale) {
  "use cache";

  const t = await getTranslations({
    locale,
    namespace: "layout",
  });

  return {
    skipToContent: t("skipToContent"),
  };
}
