"use client";

import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { useApplicationRootContext } from "@/features/application/application-root";
import { ErrorStateContent } from "@/features/error-handling/error-state-content";
import { useMountEffect } from "@/hooks/use-mount-effect";

type Props = {
  error: Error & { digest?: string };
  reset(): void;
};

export default function Error({ error, reset }: Props) {
  const t = useTranslations("common.error");
  const { applicationEntryHref } = useApplicationRootContext();

  useMountEffect(() => {
    console.error("[application-shell-error-boundary]", error);
  });

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
        <ErrorStateContent
          className="h-full min-h-96"
          error={error}
          href={applicationEntryHref}
          hrefLabel={t("goToApp")}
          reset={reset}
        />
      </Container>
    </ApplicationPageShell>
  );
}
