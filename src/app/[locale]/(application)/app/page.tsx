import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { createPageMetadata } from "@/lib/metadata";
import { LifeBuoyIcon, Settings2Icon, ShieldCheckIcon, UserIcon } from "lucide-react";

export async function generateMetadata(props: PageProps<"/[locale]/app">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.app",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/app",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/app">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const tApp = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.app",
  });
  const tNav = await getTranslations({
    locale: locale as Locale,
    namespace: "layout.navigation.items",
  });

  const appHomeCards = [
    {
      key: "account",
      href: "/account" as const,
      icon: UserIcon,
    },
    {
      key: "preferences",
      href: "/account/preferences" as const,
      icon: Settings2Icon,
    },
    {
      key: "security",
      href: "/account/security" as const,
      icon: ShieldCheckIcon,
    },
    {
      key: "support",
      href: "/contact/support" as const,
      icon: LifeBuoyIcon,
    },
  ] as const;

  return (
    <ApplicationPageShell
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{tNav("app")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <Container size="xl" className="space-y-8 pt-10 pb-24">
        <section className="max-w-3xl space-y-2">
          <h1 className="font-heading text-3xl/[1.1] font-semibold tracking-tight text-pretty sm:text-4xl/[1.1]">
            {tApp("title")}
          </h1>
          <p className="text-muted-foreground text-sm text-pretty sm:text-base">
            {tApp("description")}
          </p>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {appHomeCards.map((card) => {
            const CardIcon = card.icon;

            return (
              <Card key={card.key}>
                <CardHeader>
                  <div className="bg-muted flex size-10 items-center justify-center rounded-md">
                    <CardIcon aria-hidden="true" className="size-5" />
                  </div>
                  <CardTitle>{tApp(`cards.${card.key}.title`)}</CardTitle>
                  <CardDescription>{tApp(`cards.${card.key}.description`)}</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button nativeButton={false} render={<Link href={card.href} />}>
                    {tApp(`cards.${card.key}.cta`)}
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </section>
      </Container>
    </ApplicationPageShell>
  );
}
