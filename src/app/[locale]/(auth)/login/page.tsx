import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
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
    <div>
      <h1>{t("title")}</h1>
      <p>{t("description")}</p>

      <Card>
        <CardHeader>
          <h2 className="text-2xl font-bold">{t("welcomeBack")}</h2>
        </CardHeader>
        <CardContent>
          <LoginForm />
          <p className="mt-6 text-sm">
            {t("newHere")}{" "}
            <Link href="/sign-up" className="underline hover:no-underline">
              {t("createAccount")}
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
