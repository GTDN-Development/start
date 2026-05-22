import { FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

type DocumentExportPanelProps = {
  title: string;
  description: string;
  ctaLabel: string;
  href: string;
};

export function DocumentExportPanel({
  title,
  description,
  ctaLabel,
  href,
}: DocumentExportPanelProps) {
  return (
    <section className="border-border bg-background rounded-md border p-6">
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl font-semibold">{title}</h2>
          <p className="text-muted-foreground text-sm leading-6">{description}</p>
        </div>

        <Button
          nativeButton={false}
          render={<a href={href} target="_blank" rel="noopener noreferrer" />}
          className="w-full md:w-fit"
        >
          <FileTextIcon aria-hidden="true" />
          {ctaLabel}
        </Button>
      </div>
    </section>
  );
}
