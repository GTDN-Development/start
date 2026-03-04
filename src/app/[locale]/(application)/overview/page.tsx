import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Container } from "@/components/ui/container";
import { createPageMetadata } from "@/lib/metadata";
import {
  ApplicationHero,
  ApplicationHeroContent,
  ApplicationHeroDescription,
  ApplicationHeroTitle,
} from "@/features/application/overview/application-hero";
import { Placeholder, PlaceholderTitle } from "@/components/ui/placeholder";

export async function generateMetadata(props: PageProps<"/[locale]/overview">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.overview",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/overview",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/overview">) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.overview",
  });

  return (
    <div className="relative">
      <ApplicationHero>
        <ApplicationHeroContent>
          <ApplicationHeroTitle>{t("title")}</ApplicationHeroTitle>
          <ApplicationHeroDescription>{t("description")}</ApplicationHeroDescription>
        </ApplicationHeroContent>
      </ApplicationHero>

      <Container size="xl" className="space-y-16 pb-24">
        {/* Overview content goes here */}
        <Placeholder>
          <PlaceholderTitle>Overview Content</PlaceholderTitle>
        </Placeholder>

        <Placeholder>
          <PlaceholderTitle>Overview Content</PlaceholderTitle>
        </Placeholder>
      </Container>
    </div>
  );
}
