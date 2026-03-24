import { Locale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { Container } from "@/components/ui/container";
import {
  settingsInnerSidebarItems,
  mapInnerSidebarItems,
} from "@/features/application/inner-sidebar/inner-sidebar-items";
import { InnerSidebarBreadcrumbs } from "@/features/application/inner-sidebar/inner-sidebar-breadcrumbs";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
import { ApplicationPageShell } from "@/features/application/application-page-shell";

export default async function Layout({ children, params }: LayoutProps<"/[locale]/settings">) {
  const { locale } = await params;
  const currentLocale = locale as Locale;
  const tSettings = await getTranslations({
    locale: currentLocale,
    namespace: "pages.settings",
  });
  const tNav = await getTranslations({
    locale: currentLocale,
    namespace: "layout.navigation.items",
  });

  const innerSidebarItems = mapInnerSidebarItems(settingsInnerSidebarItems, tSettings);

  return (
    <ApplicationPageShell
      breadcrumbs={
        <InnerSidebarBreadcrumbs
          items={innerSidebarItems}
          rootHref="/settings/profile"
          rootLabel={tNav("settings")}
        />
      }
    >
      <Container className="pt-10 pb-24">
        <InnerSidebarLayout title={tNav("settings")} items={innerSidebarItems}>
          {children}
        </InnerSidebarLayout>
      </Container>
    </ApplicationPageShell>
  );
}
