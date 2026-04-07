import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import {
  getChangelogEntries,
  isChangelogLocale,
} from "@/features/marketing/about/changelog/changelog-content";
import { ChangelogTimeline } from "@/features/marketing/about/changelog/changelog-timeline";
import { createPublicPageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/about/changelog">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.aboutChangelog",
  });

  return createPublicPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/about/changelog",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/about/changelog">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.aboutChangelog",
  });

  const changelogLocale = isChangelogLocale(locale) ? locale : "cs";
  const entries = getChangelogEntries(changelogLocale);

  return (
    <div className="relative">
      <Hero>
        <HeroContent size="md" className="pb-8 sm:pb-10">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
        </HeroContent>
      </Hero>

      <ChangelogTimeline entries={entries} />
    </div>
  );
}
