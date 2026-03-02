import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { PlatformLayout } from "@/features/platform/platform-layout";
import { AUTH_REDIRECTS } from "@/features/auth/auth-routes";
import { getServerAuthSession } from "@/server/auth/auth-service";

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
  const authSession = await getServerAuthSession();

  if (!authSession.ok) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: locale as Locale,
    });

    return null;
  }

  const sessionPayload = authSession.ok ? authSession.data : null;
  const session = sessionPayload?.session;

  if (!session) {
    redirect({
      href: AUTH_REDIRECTS.unauthenticatedTo,
      locale: locale as Locale,
    });

    return null;
  }

  const user = {
    email: session.user.email,
    name: session.user.name,
    verified: session.user.verified,
    avatarUrl: session.user.avatarUrl,
  };

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
