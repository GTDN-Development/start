import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { createPublicPageMetadata } from "@/lib/metadata";
import { Placeholder, PlaceholderTitle } from "@/components/ui/placeholder";

export async function generateMetadata(
  props: PageProps<"/[locale]/about/integrations">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.aboutIntegrations",
  });

  return createPublicPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/about/integrations",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/about/integrations">) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.aboutIntegrations",
  });

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
