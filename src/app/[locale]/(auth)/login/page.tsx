import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { Link } from "@/components/ui/link";
import { LoginForm } from "@/components/(auth)/login/login-form";
import { site } from "@/config/site";

export async function generateMetadata(props: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "LoginPage",
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

export default function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("LoginPage");

  return (
    <div>
      <Hero>
        <HeroContent size="sm">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
        </HeroContent>
      </Hero>

      <Container size="sm" className="pb-24">
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
      </Container>
    </div>
  );
}
