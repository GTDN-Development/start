import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import {
  getVersionHistoryEntries,
  isVersionHistoryLocale,
} from "@/features/marketing/about/version-history/version-history-content";
import { VersionHistoryTimeline } from "@/features/marketing/about/version-history/version-history-timeline";
import { createPublicPageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/about/version-history">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.aboutVersionHistory",
  });

  return createPublicPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/about/version-history",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/about/version-history">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.aboutVersionHistory",
  });

  const versionHistoryLocale = isVersionHistoryLocale(locale) ? locale : "cs";
  const entries = getVersionHistoryEntries(versionHistoryLocale);

  return (
    <div className="relative">
      <Hero>
        <HeroContent size="md" className="pb-8 sm:pb-10">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
        </HeroContent>
      </Hero>

      <VersionHistoryTimeline entries={entries} />
    </div>
  );
}
