"use client";

import { useTranslations } from "next-intl";
import { Container } from "@/components/ui/container";
import { ErrorStateContent } from "@/features/error-handling/error-state-content";
import { useMountEffect } from "@/hooks/use-mount-effect";

type Props = {
  error: Error & { digest?: string };
  reset(): void;
};

export default function Error({ error, reset }: Props) {
  const t = useTranslations("common.error");

  // Audited exception: error boundaries legitimately need reporting side effects
  // after render, and this one is intentionally kept explicit.
  useMountEffect(() => {
    console.error("[locale-error-boundary]", error);
  });

  return (
    <main className="flex min-h-dvh items-center py-12">
      <Container size="md">
        <ErrorStateContent error={error} href="/" hrefLabel={t("goHome")} reset={reset} />
      </Container>
    </main>
  );
}
