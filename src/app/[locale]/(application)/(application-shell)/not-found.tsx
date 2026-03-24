"use client";

import { useTranslations } from "next-intl";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Container } from "@/components/ui/container";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { ApplicationPageShell } from "@/features/application/application-page-shell";
import { FileSearchIcon } from "lucide-react";

export default function NotFound() {
  const tCommon = useTranslations("common.notFound");

  return (
    <ApplicationPageShell
      className="grid"
      breadcrumbs={
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage>{tCommon("title")}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      }
    >
      <Container size="xl" className="h-full pt-10 pb-24">
        <Empty className="border-border h-full min-h-96 border">
          <EmptyHeader>
            <EmptyMedia>
              <FileSearchIcon aria-hidden="true" />
            </EmptyMedia>
            <EmptyTitle>{tCommon("title")}</EmptyTitle>
            <EmptyDescription>{tCommon("description")}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      </Container>
    </ApplicationPageShell>
  );
}
