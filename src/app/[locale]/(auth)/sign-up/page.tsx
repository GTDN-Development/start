import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Link } from "@/components/ui/link";
import { AuthPageShell } from "@/components/(auth)/auth-page-shell";
import { SignUpForm } from "@/components/(auth)/sign-up/sign-up-form";
import { site } from "@/config/site";

export async function generateMetadata(props: PageProps<"/[locale]/sign-up">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.signUp",
  });

  return {
    metadataBase: new URL(site.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/sign-up",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${site.url}/sign-up`,
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

export default function Page({ params }: PageProps<"/[locale]/sign-up">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.signUp");

  return (
    <AuthPageShell
      title={t("title")}
      description={t("description")}
      heading={t("createYourAccount")}
      footer={
        <>
          {t("alreadyHaveAccount")}{" "}
          <Link href="/login" className="underline decoration-current/30 hover:decoration-current">
            {t("logIn")}
          </Link>
          .
        </>
      }
    >
      <SignUpForm />
    </AuthPageShell>
  );
}
