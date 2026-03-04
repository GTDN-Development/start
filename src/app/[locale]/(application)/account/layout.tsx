import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AccountLayout } from "@/features/account/account-layout";
import { Container } from "@/components/ui/container";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "@/components/ui/link";
import { ApplicationPageShell } from "@/features/application/new/application-page-shell";
import {
  ApplicationPageHero,
  ApplicationPageHeroContent,
  ApplicationPageHeroDescription,
  ApplicationPageHeroTitle,
} from "@/features/application/new/application-page-hero";

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
  const tNav = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });

  return (
    <ApplicationPageShell
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink render={<Link href="/overview" />}>{tNav("overview")}</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{tNav("account")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <ApplicationPageHero>
        <ApplicationPageHeroContent size="xl">
          <ApplicationPageHeroTitle>{tAccount("title")}</ApplicationPageHeroTitle>
          <ApplicationPageHeroDescription>{tAccount("description")}</ApplicationPageHeroDescription>
        </ApplicationPageHeroContent>
      </ApplicationPageHero>

      <Container className="pb-24">
        <AccountLayout>{children}</AccountLayout>
      </Container>
    </ApplicationPageShell>
  );
}
