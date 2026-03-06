import { ApplicationFooter } from "./application-footer";
import { ApplicationPageHeader, type ApplicationPageHeaderProps } from "./application-page-header";

export function ApplicationPageShell({
  breadcrumbs,
  children,
}: ApplicationPageHeaderProps & { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col justify-between *:shrink-0 *:grow-0 *:data-[slot=main]:shrink *:data-[slot=main]:grow">
      <ApplicationPageHeader breadcrumbs={breadcrumbs} />

      <div data-slot="main" className="relative isolate min-w-0">
        {children}
      </div>

      <ApplicationFooter />
    </div>
  );
}
