"use client";

import type { ReactNode } from "react";
import { useTranslations } from "next-intl";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type LoadingStateProps = {
  className?: string;
  description?: ReactNode;
  title?: ReactNode;
};

export function LoadingState({ className, description, title }: LoadingStateProps) {
  const t = useTranslations("common.loading");
  const resolvedTitle = title === undefined ? t("title") : title;

  return (
    <div
      aria-live="polite"
      data-slot="loading-state"
      role="status"
      className={cn(
        "flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 p-12 text-center text-balance",
        className
      )}
    >
      <div className="flex size-10 shrink-0 items-center justify-center">
        <Spinner aria-hidden="true" className="size-5" />
      </div>

      <div className="flex max-w-sm flex-col items-center gap-2">
        {resolvedTitle ? (
          <div
            data-slot="loading-state-title"
            className="font-heading text-lg font-medium tracking-tight"
          >
            {resolvedTitle}
          </div>
        ) : null}

        {description ? (
          <p
            data-slot="loading-state-description"
            className="text-muted-foreground text-sm/relaxed"
          >
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
