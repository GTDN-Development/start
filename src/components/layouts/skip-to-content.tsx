import { Link, type LinkProps } from "@/components/ui/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";

export function SkipToContent({ children, className, ...props }: LinkProps) {
  return (
    <Link
      {...props}
      className={cn(
        buttonVariants({ variant: "default" }),
        "fixed top-6 left-6 z-1000 hidden -translate-y-[1000%] focus-visible:translate-y-0 pointer-fine:block",
        className
      )}
    >
      {children}
    </Link>
  );
}
