import { cn } from "@/lib/utils";

export function PlatformPage({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("relative", className)}>
      {children}
    </div>
  );
}
