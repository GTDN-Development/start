"use client";

import { useTranslations } from "next-intl";
import { SIGN_IN_PATH } from "@/config/routes";
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
      className="min-h-96"
      error={error}
      href={SIGN_IN_PATH}
      hrefLabel={t("goToSignIn")}
      reset={reset}
    />
  );
}
