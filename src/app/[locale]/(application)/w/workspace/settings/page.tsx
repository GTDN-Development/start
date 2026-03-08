import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { Placeholder, PlaceholderTitle } from "@/components/ui/placeholder";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
import { createWorkspaceSettingsInnerSidebarMenu } from "@/features/application/inner-sidebar/inner-sidebar-menus";
import { ApplicationPageShell } from "@/features/application/new/application-page-shell";
import { SettingsPage } from "@/features/application/settings-page";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/w/workspace/settings">
): Promise<Metadata> {
  const { locale } = await props.params;
  const tNav = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });
  const tWorkspaceNav = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.workspace.nav",
  });

  return createPageMetadata({
    title: `${tNav("workspace")} · ${tWorkspaceNav("general")}`,
    description: tWorkspaceNav("general"),
    locale: locale as Locale,
    pathname: "/w/workspace/settings",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/w/workspace/settings">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const tNav = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });
  const tWorkspace = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.workspace",
  });
  const tWorkspaceNav = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.workspace.nav",
  });
  const innerSidebar = createWorkspaceSettingsInnerSidebarMenu({
    title: tNav("workspace"),
    general: tWorkspaceNav("general"),
    members: tWorkspaceNav("members"),
  });

  return (
    <ApplicationPageShell
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{tWorkspace("title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <Container size="xl" className="pt-10 pb-24">
        <InnerSidebarLayout title={innerSidebar.title} items={innerSidebar.items}>
          <SettingsPage title={tWorkspaceNav("general")}>
            <Placeholder>
              <PlaceholderTitle>Content</PlaceholderTitle>
            </Placeholder>
          </SettingsPage>
        </InnerSidebarLayout>
      </Container>
    </ApplicationPageShell>
  );
}
