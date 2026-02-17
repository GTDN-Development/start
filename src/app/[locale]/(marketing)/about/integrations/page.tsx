import type { Metadata } from "next";
import { Locale, useTranslations } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { use } from "react";
import { MarketingPlaceholderPage } from "@/components/(marketing)/marketing-placeholder-page";
import { site } from "@/config/site";

export async function generateMetadata(
  props: PageProps<"/[locale]/about/integrations">
): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.aboutIntegrations",
  });

  return {
    metadataBase: new URL(site.url),
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: "/about/integrations",
    },
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `${site.url}/about/integrations`,
    },
    twitter: {
      title: t("title"),
      description: t("description"),
    },
  };
}

export default function Page({ params }: PageProps<"/[locale]/about/integrations">) {
  const { locale } = use(params);

  // Enable static rendering
  setRequestLocale(locale as Locale);

  const t = useTranslations("pages.aboutIntegrations");

  return (
    <MarketingPlaceholderPage
      title={t("title")}
      description={t("description")}
      contentTitle={t("contentTitle")}
      contentDescription={t("contentDescription")}
    />
  );
}
