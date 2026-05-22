import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ApplicationPageHero,
  ApplicationPageHeroContent,
  ApplicationPageHeroDescription,
  ApplicationPageHeroTitle,
} from "@/features/application/application-page-hero";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("layout.navigation.items");

  return (
    <ApplicationPageShell
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{t("documentExport")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <ApplicationPageHero>
        <ApplicationPageHeroContent size="xl">
          <ApplicationPageHeroTitle render={<div />}>
            <Skeleton className="h-8 w-56 sm:h-10 sm:w-72" />
          </ApplicationPageHeroTitle>
          <ApplicationPageHeroDescription render={<div />}>
            <Skeleton className="h-5 w-full max-w-xl" />
          </ApplicationPageHeroDescription>
        </ApplicationPageHeroContent>
      </ApplicationPageHero>

      <Container size="xl" className="pt-4 pb-24">
        <section className="border-border bg-background rounded-md border p-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="w-full max-w-2xl space-y-2">
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-full max-w-xl" />
              <Skeleton className="h-4 w-3/4 max-w-lg" />
            </div>

            <Skeleton className="h-9 w-full md:w-28" />
          </div>
        </section>
      </Container>
    </ApplicationPageShell>
  );
}
