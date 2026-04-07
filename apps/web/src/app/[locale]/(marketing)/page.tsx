import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
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
import {
  getChangelogEntries,
  isChangelogLocale,
} from "@/features/marketing/about/changelog/changelog-content";
import { ChangelogSection } from "@/features/marketing/home/changelog-section";
import { NewsletterCta } from "@/features/marketing/home/newsletter-cta";
import { PatternGrid } from "@/components/ui/patterns";
import { MarqueeCompanies } from "@/features/marketing/home/marquee-companies";
// import { Placeholder, PlaceholderTitle } from "@/components/ui/placeholder";
import { createPublicPageMetadata } from "@/lib/metadata";
import {
  HomeFeature,
  HomeFeatureDescription,
  HomeFeatureHeader,
  HomeFeatureHeaderAside,
  HomeFeatureMedia,
  HomeFeatureTitle,
} from "@/features/marketing/home/home-feature";
import OgImage from "@/assets/images/og-image.jpg";
import Image from "next/image";
import {
  HomeCta,
  HomeCtaActions,
  HomeCtaDescription,
  HomeCtaTitle,
} from "@/features/marketing/home/home-cta";
import { Separator } from "@/components/ui/separator";
import { FaqSection } from "@/features/marketing/contact/faq-section";

export async function generateMetadata(props: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.home",
  });
  const metadataTitle = t.markup("title", {
    break: () => " ",
  });

  return createPublicPageMetadata({
    title: metadataTitle,
    description: t("description"),
    locale: locale as Locale,
    pathname: "/",
  });
}

export default async function Page({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.home",
  });

  const changelogLocale = isChangelogLocale(locale) ? locale : "cs";
  const changelogEntries = getChangelogEntries(changelogLocale).slice(0, 5);

  return (
    <div className="relative">
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
          {/*<Placeholder>
            <PlaceholderTitle>Content</PlaceholderTitle>
          </Placeholder>*/}

          <HomeFeature>
            <HomeFeatureHeader>
              <HomeFeatureTitle>Lorem ipsum dolor</HomeFeatureTitle>
              <HomeFeatureHeaderAside>
                <HomeFeatureDescription>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam ullamcorper nunc a
                  lectus eleifend, sed laoreet nulla pretium. Praesent dictum mi nunc, sit amet
                  gravida turpis lobortis et.
                </HomeFeatureDescription>
                <a
                  href="#"
                  className="text-foreground hover:text-foreground/70 inline-flex items-center gap-1 text-sm font-medium transition-colors"
                >
                  Zjistit více
                </a>
              </HomeFeatureHeaderAside>
            </HomeFeatureHeader>
            <HomeFeatureMedia>
              <Image src={OgImage} alt="" className="w-full" />
            </HomeFeatureMedia>
          </HomeFeature>
        </Container>

        <Container>
          <Separator />
        </Container>

        <Container>
          <HomeFeature>
            <HomeFeatureHeader>
              <HomeFeatureTitle>Lorem ipsum dolor</HomeFeatureTitle>
              <HomeFeatureHeaderAside>
                <HomeFeatureDescription>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam ullamcorper nunc a
                  lectus eleifend, sed laoreet nulla pretium. Praesent dictum mi nunc, sit amet
                  gravida turpis lobortis et.
                </HomeFeatureDescription>
                <a
                  href="#"
                  className="text-foreground hover:text-foreground/70 inline-flex items-center gap-1 text-sm font-medium transition-colors"
                >
                  Zjistit více
                </a>
              </HomeFeatureHeaderAside>
            </HomeFeatureHeader>
            <HomeFeatureMedia>
              <div className="h-100 w-full bg-gray-300"></div>
            </HomeFeatureMedia>
          </HomeFeature>
        </Container>

        <Container render={<section />}>
          <ChangelogSection entries={changelogEntries} />
        </Container>

        <Container render={<section />}>
          <NewsletterCta />
        </Container>

        <Container render={<section />}>
          <FaqSection />
        </Container>

        <Container>
          <HomeCta>
            <HomeCtaTitle>Call to Action Title</HomeCtaTitle>
            <HomeCtaDescription>Call to Action Description</HomeCtaDescription>
            <HomeCtaActions>
              <Button size="lg">Action 1</Button>
              <Button size="lg" variant="secondary">
                Action 2
              </Button>
            </HomeCtaActions>
          </HomeCta>
        </Container>
      </div>
    </div>
  );
}
