import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Container } from "@/components/ui/container";
import { createPageMetadata } from "@/lib/metadata";
import {
  PlatformHero,
  PlatformHeroContent,
  PlatformHeroDescription,
  PlatformHeroTitle,
} from "@/components/platform/platform-hero";
import { Placeholder, PlaceholderTitle } from "@/components/ui/placeholder";

export async function generateMetadata(props: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.dashboard",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/dashboard",
  });
}

export default function Page({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.dashboard");

  return (
    <div className="relative">
      <PlatformHero>
        <PlatformHeroContent>
          <PlatformHeroTitle>{t("title")}</PlatformHeroTitle>
          <PlatformHeroDescription>{t("description")}</PlatformHeroDescription>
        </PlatformHeroContent>
      </PlatformHero>

      <Container size="xl" className="space-y-16 pb-24">
        {/* Dashboard content goes here */}
        <Placeholder>
          <PlaceholderTitle>Dashboard Content</PlaceholderTitle>
        </Placeholder>

        <Placeholder>
          <PlaceholderTitle>Dashboard Content</PlaceholderTitle>
        </Placeholder>
      </Container>
    </div>
  );
}
