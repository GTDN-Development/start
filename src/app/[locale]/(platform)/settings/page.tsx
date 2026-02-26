import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountSettingsPanel } from "@/components/platform/settings/account-settings-panel";
import { Container } from "@/components/ui/container";
import { createPageMetadata } from "@/lib/metadata";
import {
  PlatformHero,
  PlatformHeroContent,
  PlatformHeroDescription,
  PlatformHeroTitle,
} from "@/components/platform/platform-hero";

export async function generateMetadata(props: PageProps<"/[locale]/settings">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.settings",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/settings",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/settings">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const tSettings = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.settings",
  });

  return (
    <div className="relative">
      <PlatformHero>
        <PlatformHeroContent>
          <PlatformHeroTitle>{tSettings("title")}</PlatformHeroTitle>
          <PlatformHeroDescription>{tSettings("description")}</PlatformHeroDescription>
        </PlatformHeroContent>
      </PlatformHero>

      <Container className="pb-24">
        <div className="mx-auto mt-6 max-w-4xl">
          <AccountSettingsPanel />
        </div>
      </Container>
    </div>
  );
}
