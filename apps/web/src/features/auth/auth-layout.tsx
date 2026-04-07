import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { LocalizedPathLink } from "@/components/ui/link";
import { LogoStart } from "@/components/brand/logo-start";

type AuthLayoutProps = React.ComponentProps<"div"> & {
  homeAriaLabel: string;
  homeHref: string;
};

export function AuthLayout({
  children,
  className,
  homeAriaLabel,
  homeHref,
  ...props
}: AuthLayoutProps) {
  return (
    <div
      {...props}
      className={cn(
        "[--navbar-height:--spacing(16)]",
        "relative isolate flex min-h-dvh w-full flex-col justify-between *:shrink-0 *:grow-0 *:data-[slot=main]:shrink *:data-[slot=main]:grow",
        className
      )}
    >
      {/* Header */}
      <Container
        size="sm"
        render={<header />}
        className="flex h-(--navbar-height) items-center justify-center"
      >
        <LocalizedPathLink href={homeHref} aria-label={homeAriaLabel}>
          <LogoStart aria-hidden="true" className="w-18" />
        </LocalizedPathLink>
      </Container>

      {/* Main content */}
      <main
        data-slot="main"
        className="flex min-h-[calc(100dvh-var(--navbar-height))] min-w-0 items-start justify-center py-12"
      >
        <Container size="sm" className="grid place-items-center">
          <div className="mx-auto w-full max-w-sm">{children}</div>
        </Container>
      </main>
    </div>
  );
}
