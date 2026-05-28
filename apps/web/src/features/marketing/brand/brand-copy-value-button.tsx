"use client";

import { CheckIcon, CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { CopyButton } from "@/components/ui/copy-button";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function BrandCopyValueButton({ format, value }: { format: string; value: string }) {
  const t = useTranslations("pages.brand.copy");

  return (
    <CopyButton
      toCopy={value}
      aria-label={t("ariaLabel", { format })}
      onCopy={() => toast(t("copied", { format, value }), { position: "bottom-center" })}
      className={cn(
        buttonVariants({ variant: "outline", size: "sm" }),
        "h-auto min-h-8 w-full justify-start gap-3 px-2 py-2 text-left whitespace-normal"
      )}
    >
      {({ isCopied }) => (
        <>
          <span className="text-muted-foreground shrink-0 text-xs font-medium">{format}</span>
          <code className="min-w-0 flex-1 font-mono text-xs font-normal break-all">{value}</code>
          {isCopied ? (
            <CheckIcon aria-hidden="true" data-icon="inline-end" />
          ) : (
            <CopyIcon aria-hidden="true" data-icon="inline-end" />
          )}
        </>
      )}
    </CopyButton>
  );
}
