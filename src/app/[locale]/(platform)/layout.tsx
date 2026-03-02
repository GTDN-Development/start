import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { PlatformLayout } from "@/features/platform/platform-layout";
import { createStaticAccountProfileSnapshot } from "@/features/account/account-profile";

type PlatformRouteLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

export default async function Layout({ children, params }: PlatformRouteLayoutProps) {
  const { locale } = await params;
  const user = createStaticAccountProfileSnapshot();

  const tPlatform = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.platform",
  });
  const tNavigation = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });

  return (
    <PlatformLayout
      user={user}
      locale={locale}
      labels={{
        dashboard: tNavigation("dashboard"),
        userMenu: {
          account: tNavigation("account"),
          accountPage: tNavigation("account"),
          home: tNavigation("home"),
          dashboard: tNavigation("dashboard"),
          emailNotVerified: tPlatform("emailNotVerified"),
          emailVerified: tPlatform("emailVerified"),
          logout: tPlatform("logout"),
        },
      }}
    >
      {children}
    </PlatformLayout>
  );
}
