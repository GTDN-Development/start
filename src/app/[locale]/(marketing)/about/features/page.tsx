import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { MarketingPlaceholderPage } from "@/components/(marketing)/marketing-placeholder-page";
import { site } from "@/config/site";

export async function generateMetadata(
  props: PageProps<"/[locale]/about/features">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.aboutFeatures",
  });

  return {
    metadataBase: new URL(site.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/about/features",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${site.url}/about/features`,
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
  };
}

export default function Page({ params }: PageProps<"/[locale]/about/features">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.aboutFeatures");

  return (
    <MarketingPlaceholderPage
      title={t("title")}
      description={t("description")}
      contentTitle={t("contentTitle")}
      contentDescription={t("contentDescription")}
    />
  );
}
