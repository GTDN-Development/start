import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { ArrowLeftIcon } from "lucide-react";
import { BackLink } from "@/components/ui/back-navigation";
import { Container } from "@/components/ui/container";
import {
  accountInnerSidebarItems,
  mapInnerSidebarItems,
} from "@/features/application/inner-sidebar/inner-sidebar-items";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
import { resolveApplicationEntryHref } from "@/features/application/application-entry";
import {
  ApplicationPageHero,
  ApplicationPageHeroContent,
  ApplicationPageHeroDescription,
  ApplicationPageHeroTitle,
} from "@/features/application/application-page-hero";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { requireCurrentUser } from "@/server/auth/current-user";

export default async function Layout({ children, params }: LayoutProps<"/[locale]/account">) {
  const { locale } = await params;
  const currentLocale = locale as Locale;
  const currentUser = await requireCurrentUser();
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
  const backHref = currentUser.ok ? await resolveApplicationEntryHref(currentUser.user.id) : "/app";

  return (
    <ApplicationPageShell variant="account">
      <ApplicationPageHero>
        <ApplicationPageHeroContent size="xl">
          <BackLink
            fallbackHref={backHref}
            className="text-muted-foreground hover:text-foreground flex w-fit items-center gap-1.5 text-sm transition-colors"
            backContent={
              <>
                <ArrowLeftIcon aria-hidden="true" className="size-4" />
                {tCommonNavigation("back")}
              </>
            }
          >
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            {tCommonNavigation("back")}
          </BackLink>

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
