import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { LoadingState } from "@/components/ui/loading-state";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { useTranslations } from "next-intl";

export default function Loading() {
  const t = useTranslations("common.loading");

  return (
    <ApplicationPageShell
      className="grid"
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{t("title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <Container size="xl" className="h-full pt-10 pb-24">
        <LoadingState className="h-full min-h-96" />
      </Container>
    </ApplicationPageShell>
  );
}
