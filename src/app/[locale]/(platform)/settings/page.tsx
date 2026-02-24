import { Locale, useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { use } from "react";
import { PlatformPage } from "@/components/layouts/platform/platform-page";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroTitle } from "@/components/ui/hero";

export default function Page({ params }: PageProps<"/[locale]/settings">) {
  const { locale } = use(params);

  setRequestLocale(locale as Locale);

  const tNav = useTranslations("layout.navigation.items");

  return (
    <PlatformPage>
      <div>
        <Hero>
          <HeroContent size="md">
            <HeroTitle>{tNav("settings")}</HeroTitle>
          </HeroContent>
        </Hero>

        <Container size="xl" className="pb-24" />
      </div>
    </PlatformPage>
  );
}
