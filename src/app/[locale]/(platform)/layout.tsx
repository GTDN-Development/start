import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { PlatformLayout } from "@/components/layouts/platform/platform-layout";
import { createServerPocketBaseClient } from "@/lib/pocketbase/server";

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
    redirect(`/${locale}/login` as never);
  }

  const user = getPlatformUser(pb.authStore.record);

  if (!user.email) {
    redirect(`/${locale}/login` as never);
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
          home: tNavigation("home"),
          dashboard: tNavigation("dashboard"),
          emailNotVerified: tPlatform("emailNotVerified"),
          emailVerified: tPlatform("emailVerified"),
          settings: tNavigation("settings"),
          logout: tPlatform("logout"),
        },
      }}
    >
      {children}
    </PlatformLayout>
  );
}

function getPlatformUser(record: unknown) {
  if (typeof record !== "object" || record === null) {
    return {
      email: "",
      name: null,
      verified: false,
    };
  }

  const recordData = record as Record<string, unknown>;
  const email = typeof recordData.email === "string" ? recordData.email : "";
  const name = typeof recordData.name === "string" ? recordData.name : null;
  const verified = typeof recordData.verified === "boolean" ? recordData.verified : false;

  return {
    email,
    name,
    verified,
  };
}
