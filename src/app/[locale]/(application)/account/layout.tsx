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
      title={tAccount("title")}
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
      <Container className="pt-10 pb-24">
        <AccountLayout>{children}</AccountLayout>
      </Container>
    </ApplicationPageShell>
  );
}
