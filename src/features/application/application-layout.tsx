"use client";

import { useTranslations } from "next-intl";
import { LayoutBanners } from "@/components/layout/layout-banners";
import { SkipToContent } from "@/components/layout/skip-to-content";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { showEmailVerificationBanner } from "@/features/auth/email-verification";
import { EmailVerificationBanner } from "@/features/auth/email-verification-banner";
import { useSidebarContext } from "./application-root";

type ApplicationLayoutProps = {
  children: React.ReactNode;
  sidebar?: React.ReactNode;
};

export function ApplicationLayout({ children, sidebar }: ApplicationLayoutProps) {
  const t = useTranslations("layout");
  const { user } = useSidebarContext();
  const contentId = "gtdn-app-content";
  const renderEmailVerificationBanner = showEmailVerificationBanner(user);

  return (
    <div className="relative isolate [--navbar-height:--spacing(16)]">
      <SkipToContent href={`#${contentId}`}>{t("skipToContent")}</SkipToContent>
      <SidebarProvider>
        {sidebar}

        <SidebarInset id={contentId} className="min-w-0">
          <LayoutBanners
            banners={[
              {
                isVisible: renderEmailVerificationBanner,
                content: <EmailVerificationBanner />,
              },
            ]}
          />

          {children}
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
