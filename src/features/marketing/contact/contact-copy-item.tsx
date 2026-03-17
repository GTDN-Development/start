"use client";

import { toast } from "sonner";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

export function ContactCopyItem({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  const t = useTranslations("layout.footer");

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
      <CopyButton
        toCopy={value}
        onCopy={() => toast(t("copiedToClipboard"), { description: value, position: "bottom-center" })}
        className="text-foreground hover:text-muted-foreground flex items-center gap-2 text-lg transition-colors"
      >
        {({ isCopied }) => (
          <>
            <span>{value}</span>
            {isCopied ? (
              <CheckIcon className="size-[1em]" aria-hidden="true" />
            ) : (
              <CopyIcon className="size-[1em]" aria-hidden="true" />
            )}
          </>
        )}
      </CopyButton>
    </div>
  );
}
