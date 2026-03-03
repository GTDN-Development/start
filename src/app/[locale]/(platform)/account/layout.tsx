import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountLayout } from "@/features/account/account-layout";
import { Container } from "@/components/ui/container";
import {
  PlatformHero,
  PlatformHeroContent,
  PlatformHeroDescription,
  PlatformHeroTitle,
} from "@/features/platform/overview/platform-hero";

type AccountRouteLayoutProps = {
  children: React.ReactNode;
  params: Promise<{
    locale: string;
  }>;
};

export default async function Layout({ children, params }: AccountRouteLayoutProps) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const tAccount = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.account",
  });

  return (
    <div className="relative">
      <PlatformHero>
        <PlatformHeroContent>
          <PlatformHeroTitle>{tAccount("title")}</PlatformHeroTitle>
          <PlatformHeroDescription>{tAccount("description")}</PlatformHeroDescription>
        </PlatformHeroContent>
      </PlatformHero>

      <Container className="pb-24">
        <AccountLayout>{children}</AccountLayout>
      </Container>
    </div>
  );
}
