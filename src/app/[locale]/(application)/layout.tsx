import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { ApplicationLayout } from "@/features/application/application-layout";
import { AUTH_REDIRECTS } from "@/features/auth/auth-routes";
import { getServerAuthSession } from "@/server/auth/auth-service";

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

  const tApplication = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.application",
  });
  const tNavigation = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });

  return (
    <ApplicationLayout
      user={user}
      locale={locale}
      labels={{
        overview: tNavigation("overview"),
        userMenu: {
          account: tNavigation("account"),
          accountPage: tNavigation("account"),
          home: tNavigation("home"),
          overview: tNavigation("overview"),
          emailNotVerified: tApplication("emailNotVerified"),
          emailVerified: tApplication("emailVerified"),
          signOut: tApplication("signOut"),
        },
      }}
    >
      {children}
    </ApplicationLayout>
  );
}
