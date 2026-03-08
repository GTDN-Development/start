import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { Placeholder, PlaceholderTitle } from "@/components/ui/placeholder";
import {
  mapInnerSidebarItems,
  workspaceSettingsInnerSidebarItems,
} from "@/features/application/inner-sidebar/inner-sidebar-items";
import { InnerSidebarLayout } from "@/features/application/inner-sidebar/inner-sidebar-layout";
import { ApplicationPageShell } from "@/features/application/new/application-page-shell";
import { SettingsPage } from "@/features/application/settings-page";
import { createPageMetadata } from "@/lib/metadata";

export async function generateMetadata(
  props: PageProps<"/[locale]/w/workspace/settings/members">
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
    title: `${tNav("workspace")} · ${tWorkspaceNav("members")}`,
    description: tWorkspaceNav("members"),
    locale: locale as Locale,
    pathname: "/w/workspace/settings/members",
  });
}

export default async function Page({
  params,
}: PageProps<"/[locale]/w/workspace/settings/members">) {
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

  const innerSidebarItems = mapInnerSidebarItems(workspaceSettingsInnerSidebarItems, tWorkspaceNav);

  return (
    <ApplicationPageShell
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/w/workspace/settings" />}>
                {tWorkspace("title")}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tWorkspaceNav("members")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <Container size="xl" className="pt-10 pb-24">
        <InnerSidebarLayout title={tNav("workspace")} items={innerSidebarItems}>
          <SettingsPage title={tWorkspaceNav("members")}>
            <Placeholder>
              <PlaceholderTitle>Content</PlaceholderTitle>
            </Placeholder>
          </SettingsPage>
        </InnerSidebarLayout>
      </Container>
    </ApplicationPageShell>
  );
}
