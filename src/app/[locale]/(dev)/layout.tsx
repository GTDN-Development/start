import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ApplicationLayout } from "@/features/application/application-layout";

type ApplicationRouteLayoutProps = {
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

export default async function Layout({ children, params }: ApplicationRouteLayoutProps) {
  const { locale } = await params;
  const tApplication = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.application",
  });
  const tNavigation = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });
  const tHeaderMenu = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.header.menu",
  });

  return (
    <ApplicationLayout
      user={{
        email: "demo@example.com",
        name: "Demo User",
        verified: true,
        avatarUrl: null,
      }}
      locale={locale}
      labels={{
        userMenu: {
          account: tNavigation("account"),
          accountPage: tNavigation("account"),
          home: tNavigation("home"),
          overview: tNavigation("overview"),
          emailNotVerified: tApplication("emailNotVerified"),
          emailVerified: tApplication("emailVerified"),
          signOut: tApplication("signOut"),
        },
        mobileMenu: {
          openAriaLabel: tHeaderMenu("openAriaLabel"),
          title: tHeaderMenu("title"),
          close: tHeaderMenu("close"),
        },
      }}
    >
      {children}
    </ApplicationLayout>
  );
}
