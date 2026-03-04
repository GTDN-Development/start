import { ApplicationFooter } from "./application-footer";
import { ApplicationPageNavbar, type ApplicationPageNavbarProps } from "./application-page-navbar";

export function ApplicationPageShell({
  breadcrumbs,
  title,
  children,
}: ApplicationPageNavbarProps & { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col justify-between *:shrink-0 *:grow-0 *:data-[slot=main]:shrink *:data-[slot=main]:grow">
      <ApplicationPageNavbar breadcrumbs={breadcrumbs} title={title} />

      <main data-slot="main" className="min-w-0">
        {children}
      </main>

      <ApplicationFooter />
    </div>
  );
}
