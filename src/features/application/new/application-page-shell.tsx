import { ApplicationFooter } from "./application-footer";
import { ApplicationPageNavbar, type ApplicationPageNavbarProps } from "./application-page-navbar";

export function ApplicationPageShell({
  breadcrumbs,
  title,
  children,
}: ApplicationPageNavbarProps & { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 w-full flex-1 flex-col justify-between *:shrink-0 *:grow-0 *:data-[slot=main]:shrink *:data-[slot=main]:grow">
      <ApplicationPageNavbar breadcrumbs={breadcrumbs} title={title} />

      <div data-slot="main" className="relative isolate min-w-0">
        {children}
      </div>

      <ApplicationFooter />
    </div>
  );
}
