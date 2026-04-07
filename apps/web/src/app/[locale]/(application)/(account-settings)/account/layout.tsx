import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ArrowLeftIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { AccountHeroBackLink } from "@/features/account/account-hero-back-link";
import { accountInnerSidebarItems } from "@/features/account/account-inner-sidebar-items";
import { mapInnerSidebarItems } from "@/features/application/inner-sidebar/inner-sidebar-items";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
import {
  ApplicationPageHero,
  ApplicationPageHeroContent,
  ApplicationPageHeroDescription,
  ApplicationPageHeroTitle,
} from "@/features/application/application-page-hero";
import { ApplicationPageShell } from "@/features/application/application-page-shell";

export default async function Layout({ children, params }: LayoutProps<"/[locale]/account">) {
  const { locale } = await params;
  const currentLocale = locale as Locale;
  const tAccount = await getTranslations({
    locale: currentLocale,
    namespace: "pages.account",
  });
  const tNav = await getTranslations({
    locale: currentLocale,
    namespace: "layout.navigation.items",
  });
  const tCommonNavigation = await getTranslations({
    locale: currentLocale,
    namespace: "common.navigation",
  });

  const innerSidebarItems = mapInnerSidebarItems(accountInnerSidebarItems, tAccount);

  return (
    <ApplicationPageShell variant="account">
      <ApplicationPageHero>
        <ApplicationPageHeroContent size="xl">
          <AccountHeroBackLink className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm transition-colors">
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            {tCommonNavigation("back")}
          </AccountHeroBackLink>

          <div className="max-w-2xl space-y-3">
            <ApplicationPageHeroTitle className="text-left">
              {tAccount("title")}
            </ApplicationPageHeroTitle>
            <ApplicationPageHeroDescription className="max-w-none text-left">
              {tAccount("description")}
            </ApplicationPageHeroDescription>
          </div>
        </ApplicationPageHeroContent>
      </ApplicationPageHero>

      <Container className="mt-10 pb-24">
        <InnerSidebarLayout title={tNav("myAccount")} items={innerSidebarItems}>
          {children}
        </InnerSidebarLayout>
      </Container>
    </ApplicationPageShell>
  );
}
