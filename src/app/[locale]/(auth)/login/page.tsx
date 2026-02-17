import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/components/ui/link";
import { AuthPageShell } from "@/components/(auth)/auth-page-shell";
import { LoginForm } from "@/components/(auth)/login/login-form";
import { site } from "@/config/site";

export async function generateMetadata(props: PageProps<"/[locale]/login">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.login",
  });

  return {
    metadataBase: new URL(site.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/login",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${site.url}/login`,
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default function Page({ params }: PageProps<"/[locale]/login">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.login");

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      heading={t("welcomeBack")}
      footer={
        <>
          {t("newHere")}{" "}
          <Link
            href="/sign-up"
            className="underline decoration-current/30 hover:decoration-current"
          >
            {t("createAccount")}
          </Link>
          .
        </>
      }
    >
      <LoginForm />
    </AuthPageShell>
  );
}
