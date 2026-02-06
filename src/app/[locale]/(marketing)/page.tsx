import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  Hero,
  HeroActions,
  HeroBackground,
  HeroContent,
  HeroDescription,
  HeroTitle,
} from "@/components/ui/hero";
import CubeSvg from "@/assets/svgs/cube.svg";
import { FeaturesBlock } from "@/components/(marketing)/home/features-block";
import { NewsletterCta } from "@/components/(marketing)/home/newsletter-cta";
import { PatternGrid } from "@/components/ui/patterns";
import { site } from "@/config/site";

export async function generateMetadata(props: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.home",
  });

  return {
    metadataBase: new URL(site.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: site.url,
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
  };
}

export default function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.home");

  return (
    <div>
      <Hero>
        <HeroBackground>
          <PatternGrid className="absolute inset-0 -z-10 size-full" />
        </HeroBackground>
        <HeroContent>
          <CubeSvg className="mx-auto h-auto w-20 dark:invert" />
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
          <HeroActions>
            <Button size="lg">{t("learnMore")}</Button>
            <Button
              size="lg"
              variant="secondary"
              render={<a href="https://ui.shadcn.com/" target="_blank" rel="noopener noreferrer" />}
            >
              {t("shadcnDocs")}
            </Button>
          </HeroActions>
        </HeroContent>
      </Hero>

      <div className="space-y-16 pb-24 md:space-y-32">
        <Container render={<section />}>
          <FeaturesBlock />
        </Container>

        <Container render={<section />}>
          <NewsletterCta />
        </Container>
      </div>
    </div>
  );
}
