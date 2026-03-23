import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import {
  accountInnerSidebarItems,
  mapInnerSidebarItems,
} from "@/features/application/inner-sidebar/inner-sidebar-items";
import { InnerSidebarBreadcrumbs } from "@/features/application/inner-sidebar/inner-sidebar-breadcrumbs";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
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

  const innerSidebarItems = mapInnerSidebarItems(accountInnerSidebarItems, tAccount);

  return (
    <ApplicationPageShell
      breadcrumbs={
        <InnerSidebarBreadcrumbs
          items={innerSidebarItems}
          rootHref="/account"
          rootLabel={tNav("account")}
        />
      }
    >
      <Container className="pt-10 pb-24">
        <InnerSidebarLayout title={tNav("account")} items={innerSidebarItems}>
          {children}
        </InnerSidebarLayout>
      </Container>
    </ApplicationPageShell>
  );
}
