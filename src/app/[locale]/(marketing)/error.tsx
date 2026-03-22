"use client";

import { useTranslations } from "next-intl";
import { Hero, HeroContent } from "@/components/ui/hero";
import { ErrorStateContent } from "@/features/error-handling/error-state-content";
import { useMountEffect } from "@/hooks/use-mount-effect";

type Props = {
  error: Error & { digest?: string };
  reset(): void;
};

export default function Error({ error, reset }: Props) {
  const t = useTranslations("common.error");

  useMountEffect(() => {
    console.error("[marketing-error-boundary]", error);
  });

  return (
    <Hero>
      <HeroContent size="md">
        <ErrorStateContent
          className="min-h-96"
          error={error}
          href="/"
          hrefLabel={t("goHome")}
          reset={reset}
        />
      </HeroContent>
    </Hero>
  );
}
