"use client";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SkipToContent({ children, className, ...props }: React.ComponentProps<"a">) {
  return (
    <a
      {...props}
      className={cn(
        buttonVariants({ variant: "default", size: "lg" }),
        "fixed top-6 left-6 z-1000 hidden -translate-y-[1000%] focus-visible:translate-y-0 pointer-fine:inline-flex",
        className
      )}
    >
      {children}
    </a>
  );
}
