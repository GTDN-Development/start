import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { PlatformLayout } from "@/components/platform/platform-layout";
import { getAccountProfileSnapshot } from "@/features/account/account-profile";
import { createServerPocketBaseClient } from "@/server/pocketbase/server";

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
  const pb = await createServerPocketBaseClient({ refreshAuth: true });

  if (!pb.authStore.isValid || !pb.authStore.record) {
    redirect({ href: "/login", locale: locale as Locale });
  }

  const user = getAccountProfileSnapshot(pb.authStore.record);

  if (!user.email) {
    redirect({ href: "/login", locale: locale as Locale });
  }

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
