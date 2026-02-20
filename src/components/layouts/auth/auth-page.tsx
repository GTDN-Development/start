import { cn } from "@/lib/utils";

export function AuthPage({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("relative", className)}>
      {children}
    </div>
  );
}
