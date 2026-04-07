import { cn } from "@/lib/utils";
import { ApplicationFooter } from "./application-footer";
import { ApplicationPageHeader, type ApplicationPageHeaderProps } from "./application-page-header";

export function ApplicationPageShell({
  breadcrumbs,
  variant,
  children,
  className,
}: ApplicationPageHeaderProps & {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col justify-between *:shrink-0 *:grow-0 *:data-[slot=main]:shrink *:data-[slot=main]:grow">
      <ApplicationPageHeader breadcrumbs={breadcrumbs} variant={variant} />

      <div data-slot="main" className={cn("relative isolate min-w-0", className)}>
        {children}
      </div>

      <ApplicationFooter />
    </div>
  );
}
