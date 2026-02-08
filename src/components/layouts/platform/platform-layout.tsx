import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

// This is just temp copy of the auth layout that needs to be reworked

export function PlatformLayout({ children, className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      {...props}
      className={cn("relative isolate flex min-h-dvh w-full flex-col justify-center", className)}
    >
      <Container className="grid min-w-0 shrink grow place-items-center py-6 sm:py-10">
        <div className="w-full">{children}</div>
      </Container>
    </main>
  );
}
