import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { AuthLayout } from "@/features/auth/auth-layout";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
};

type AuthRouteLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function Layout({ children, params }: AuthRouteLayoutProps) {
  const { locale } = await params;
  const copy = await getAuthLayoutCopy(locale as Locale);

  return (
    <AuthLayout homeAriaLabel={copy.homeAriaLabel} locale={locale as Locale}>
      {children}
    </AuthLayout>
  );
}

async function getAuthLayoutCopy(locale: Locale) {
  "use cache";

  const t = await getTranslations({
    locale,
    namespace: "layout.header",
  });

  return {
    homeAriaLabel: t("homeAriaLabel"),
  };
}
