import { cn } from "@/lib/utils";
import { Container } from "@/components/ui/container";

export function AuthLayout({ children, className, ...props }: React.ComponentProps<"main">) {
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

// export function AuthLayout({ children }: { children: React.ReactNode }) {
//   return (
//     <main className="flex min-h-dvh flex-col p-2">
//       <div className="flex grow items-center justify-center p-6 lg:rounded-lg lg:bg-white lg:p-10 lg:shadow-xs lg:ring-1 lg:ring-zinc-950/5 dark:lg:bg-zinc-900 dark:lg:ring-white/10">
//         {children}
//       </div>
//     </main>
//   );
// }
