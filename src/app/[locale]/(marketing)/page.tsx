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
import AppIconSvg from "@/assets/svgs/start-app-icon.svg";
import { NewsletterCta } from "@/components/(marketing)/home/newsletter-cta";
import { MarketingPage } from "@/components/layouts/marketing/marketing-page";
import { PatternGrid } from "@/components/ui/patterns";
import { MarqueeCompanies } from "@/components/(marketing)/home/marquee-companies";
import { Placeholder, PlaceholderTitle } from "@/components/ui/placeholder";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(props: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.home",
  });
  const metadataTitle = t.markup("title", {
    break: () => " ",
  });

  return createPageMetadata({
    title: metadataTitle,
    description: t("description"),
    pathname: "/",
  });
}

export default function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.home");

  return (
    <MarketingPage>
      <Hero className="from-muted/50 bg-linear-0">
        <HeroBackground>
          <PatternGrid className="absolute inset-0 -z-10 size-full" />
        </HeroBackground>
        <HeroContent>
          <AppIconSvg className="h-auto w-16 drop-shadow-lg dark:drop-shadow-none" />
          <HeroTitle className="mt-6 text-left">
            {t.rich("title", {
              break: () => <br />,
            })}
          </HeroTitle>
          <HeroDescription className="mx-0 text-left">{t("description")}</HeroDescription>
          <HeroActions className="sm:justify-start">
            <Button size="lg">{t("learnMore")}</Button>
            <Button
              size="lg"
              variant="secondary"
              nativeButton={false}
              render={<a href="https://ui.shadcn.com/" target="_blank" rel="noopener noreferrer" />}
            >
              {t("shadcnDocs")}
            </Button>
          </HeroActions>

          <div className="bg-muted mt-20 aspect-video w-full rounded-3xl"></div>
        </HeroContent>
      </Hero>

      <div className="space-y-16 pt-16 pb-24 md:space-y-32">
        <Container render={<section />}>
          <MarqueeCompanies />
        </Container>

        <Container render={<section />}>
          <NewsletterCta />
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
