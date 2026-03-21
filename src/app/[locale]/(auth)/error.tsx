"use client";

import { useTranslations } from "next-intl";
import { ErrorStateContent } from "@/features/error-handling/error-state-content";
import { useMountEffect } from "@/hooks/use-mount-effect";

type Props = {
  error: Error & { digest?: string };
  reset(): void;
};

export default function Error({ error, reset }: Props) {
  const t = useTranslations("common.error");

  useMountEffect(() => {
    console.error("[auth-error-boundary]", error);
  });

  return (
    <ErrorStateContent
      className="min-h-[24rem]"
      error={error}
      href="/sign-in"
      hrefLabel={t("goToSignIn")}
      reset={reset}
    />
  );
}
