import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { MarketingPage } from "@/components/layouts/marketing/marketing-page";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { createPageMetadata } from "@/lib/metadata";
import { Placeholder, PlaceholderTitle } from "@/components/ui/placeholder";

export async function generateMetadata(props: PageProps<"/[locale]/pricing">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.pricing",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/pricing",
  });
}

export default function Page({ params }: PageProps<"/[locale]/pricing">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.pricing");

  return (
    <MarketingPage>
      <Hero>
        <HeroContent size="md">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
        </HeroContent>
      </Hero>

      <div className="space-y-16 pb-24">
        <Container render={<section />}>
          <Placeholder>
            <PlaceholderTitle>Content</PlaceholderTitle>
          </Placeholder>
        </Container>

        <Container render={<section />}>
          <Placeholder>
            <PlaceholderTitle>Content</PlaceholderTitle>
          </Placeholder>
        </Container>
      </div>
    </MarketingPage>
  );
}
