"use client";

import { useTranslations } from "next-intl";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

type ApplicationLayoutProps = {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
};

export function ApplicationLayout({ children, sidebar }: ApplicationLayoutProps) {
  const t = useTranslations("layout");
  const contentId = "gtdn-app-content";

  return (
    <div className="relative isolate [--navbar-height:--spacing(16)]">
      <SkipToContent href={`#${contentId}`}>{t("skipToContent")}</SkipToContent>
      <SidebarProvider>
        {sidebar}

        <SidebarInset id={contentId} className="min-w-0">
          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
