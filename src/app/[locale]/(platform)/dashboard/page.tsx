import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { site } from "@/config/site";

export async function generateMetadata(props: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.dashboard",
  });

  return {
    metadataBase: new URL(site.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/dashboard",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${site.url}/dashboard`,
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

export default function Page({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.dashboard");

  return (
    <div>
      <Hero>
        <HeroContent size="md">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
        </HeroContent>
      </Hero>

      <Container size="xl" className="pb-24">
        {/* Dashboard content goes here */}
      </Container>
    </div>
  );
}
