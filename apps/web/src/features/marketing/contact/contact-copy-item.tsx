"use client";

import { toast } from "sonner";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { CopyButton } from "@/components/ui/copy-button";
import { cn } from "@/lib/utils";

export function ContactCopyItem({
  children,
  toCopy,
  className,
}: {
  children: React.ReactNode;
  toCopy: string;
  className?: string;
}) {
  const t = useTranslations("layout.footer");

  return (
    <CopyButton
      toCopy={toCopy}
      onCopy={() =>
        toast(t("copiedValueToClipboard", { value: toCopy }), { position: "bottom-center" })
      }
      className={cn("relative", className)}
    >
      {({ isCopied }) => (
        <>
          {children}
          {isCopied ? (
            <CheckIcon aria-hidden="true" className="ml-2 inline size-[1em] opacity-60" />
          ) : (
            <CopyIcon aria-hidden="true" className="ml-2 inline size-[1em] opacity-60" />
          )}
        </>
      )}
    </CopyButton>
  );
}
