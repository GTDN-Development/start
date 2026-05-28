"use client";

import { useTranslations } from "next-intl";
import { LayoutBanners } from "@/components/layout/layout-banners";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useOptionalApplicationRootContext } from "@/features/application/application-root";

type ApplicationLayoutProps = {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
};

export function ApplicationLayout({ children, sidebar }: ApplicationLayoutProps) {
  const t = useTranslations("layout");
  const applicationRoot = useOptionalApplicationRootContext();
  const layoutBanner = applicationRoot?.layoutBanner ?? null;
  const contentId = "app-content";

  return (
    <div className="relative isolate [--navbar-height:--spacing(16)]">
      <SkipToContent href={`#${contentId}`}>{t("skipToContent")}</SkipToContent>
      <SidebarProvider>
        {sidebar}

        <SidebarInset id={contentId} className="min-w-0">
          {applicationRoot && layoutBanner && (
            <LayoutBanners banner={layoutBanner} labels={applicationRoot.layoutBannerLabels} />
          )}
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
