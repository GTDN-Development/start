import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { Card, CardContent } from "@/components/ui/card";
import { createPublicPageMetadata } from "@/lib/metadata";
import { ArrowRightIcon } from "lucide-react";
// import { FaqSection } from "@/features/marketing/contact/faq-section";
import FeaturesSection from "@/features/marketing/contact/features-section";
import { SocialMediaIcons } from "@/components/brand/social-media-icons";

export async function generateMetadata(props: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact",
  });

  return createPublicPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/contact",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.contact",
  });

  return (
    <div className="relative">
      <Hero>
        <HeroContent size="md">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
        </HeroContent>
      </Hero>

      <Container size="lg" className="pb-30">
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="hover:ring-foreground/20 relative transition-shadow">
            <CardContent className="flex flex-col gap-4 p-6 sm:p-8">
              <div className="flex flex-col gap-2">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  {t("support.title")}
                </h2>
                <p className="text-muted-foreground">{t("support.cardDescription")}</p>
              </div>
              <div className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                <Link href="/contact/support" className="after:absolute after:inset-0">
                  {t("support.title")}
                </Link>
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>

          <Card className="hover:ring-foreground/20 relative transition-shadow">
            <CardContent className="flex flex-col gap-4 p-6 sm:p-8">
              <div className="flex flex-col gap-2">
                <h2 className="font-heading text-xl font-semibold tracking-tight">
                  {t("sales.title")}
                </h2>
                <p className="text-muted-foreground">{t("sales.cardDescription")}</p>
              </div>
              <div className="text-muted-foreground flex items-center gap-1 text-sm font-medium">
                <Link href="/contact/sales" className="after:absolute after:inset-0">
                  {t("sales.title")}
                </Link>
                <ArrowRightIcon className="size-4" aria-hidden="true" />
              </div>
            </CardContent>
          </Card>
        </div>
      </Container>

      <Container size="lg" className="pb-40">
        <FeaturesSection />
      </Container>
      {/*
      <Container size="lg" className="mb-40">
        <FaqSection />
      </Container>*/}

      <Container size="lg" className="pb-40">
        <div className="flex flex-col items-center gap-4 text-center">
          <h1 className="font-heading text-4xl font-semibold tracking-tight">
            Sledujte naše sociální sítě
          </h1>
          <p className="text-muted-foreground text-sm">
            Buďte v obraze — sledujte nás na sociálních sítích.
          </p>
          <SocialMediaIcons />
        </div>
      </Container>
    </div>
  );
}
