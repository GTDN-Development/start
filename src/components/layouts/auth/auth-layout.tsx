import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";
import { Link } from "@/components/ui/link";
import { LogoStart } from "../logo-start";
import { useTranslations } from "next-intl";

export function AuthLayout({ children, className, ...props }: React.ComponentProps<"div">) {
  const t = useTranslations("layout.header");

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
        <Link href="/" aria-label={t("homeAriaLabel")}>
          <LogoStart aria-hidden="true" className="w-18" />
        </Link>
      </Container>

      {/* Main content */}
      <main
        data-slot="main"
        className="flex min-h-[calc(100dvh-var(--navbar-height))] min-w-0 items-start justify-center py-12"
      >
        <Container size="sm" className="grid place-items-center">
          <div className="mx-auto w-full max-w-md">{children}</div>
        </Container>
      </main>
    </div>
  );
}
