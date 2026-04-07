import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { createPublicPageMetadata } from "@/lib/metadata";
import { PricingCards } from "@/features/marketing/pricing/pricing-cards";
import { PricingComparison } from "@/features/marketing/pricing/pricing-comparison";

export async function generateMetadata(props: PageProps<"/[locale]/pricing">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.pricing",
  });

  return createPublicPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/pricing",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/pricing">) {
  const { locale } = await params;

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.pricing",
  });

  return (
    <div className="relative">
      <Hero>
        <HeroContent size="md">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
        </HeroContent>
      </Hero>

      <PricingCards className="py-0 pb-24" />
      <PricingComparison />
    </div>
  );
}
