import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { createPageMetadata } from "@/lib/metadata";
import { Placeholder, PlaceholderTitle } from "@/components/ui/placeholder";

export async function generateMetadata(props: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.blog",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/blog",
  });
}

export default function Page({ params }: PageProps<"/[locale]/blog">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.blog");

  return (
    <div className="relative">
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
    </div>
  );
}
