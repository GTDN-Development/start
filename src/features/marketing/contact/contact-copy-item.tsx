"use client";

import { toast } from "sonner";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

export function ContactCopyItem({
  label,
  value,
  displayValue,
  className,
  buttonClassName,
}: {
  label?: string;
  value: string;
  displayValue?: string;
  className?: string;
  buttonClassName?: string;
}) {
  const t = useTranslations("layout.footer");

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {label && <p className="text-muted-foreground text-sm font-medium">{label}</p>}
      <CopyButton
        toCopy={value}
        onCopy={() => toast(t("copiedValueToClipboard", { value }), { position: "bottom-center" })}
        className={cn("flex items-center gap-2 transition-colors", buttonClassName)}
      >
        {({ isCopied }) => (
          <>
            <span>{displayValue ?? value}</span>
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
