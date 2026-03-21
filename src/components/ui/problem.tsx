import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const problemMediaVariants = cva(
  "bg-destructive/10 text-destructive mb-2 flex size-10 shrink-0 items-center justify-center rounded-lg [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-6"
);

export function Problem({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="problem"
      className={cn(
        "border-destructive/30 bg-destructive/5 flex w-full min-w-0 flex-1 flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center text-balance",
        className
      )}
      {...props}
    />
  );
}

export function ProblemHeader({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="problem-header"
      className={cn("flex max-w-sm flex-col items-center gap-2", className)}
      {...props}
    />
  );
}

export function ProblemMedia({ className, ...props }: ComponentProps<"div">) {
  return (
    <div data-slot="problem-media" className={cn(problemMediaVariants(), className)} {...props} />
  );
}

export function ProblemTitle({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="problem-title"
      className={cn("font-heading text-lg font-medium tracking-tight", className)}
      {...props}
    />
  );
}

export function ProblemDescription({ className, ...props }: ComponentProps<"p">) {
  return (
    <p
      data-slot="problem-description"
      className={cn(
        "text-muted-foreground [&>a:hover]:text-destructive text-sm/relaxed [&>a]:underline [&>a]:underline-offset-4",
        className
      )}
      {...props}
    />
  );
}

export function ProblemContent({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="problem-content"
      className={cn(
        "flex w-full max-w-sm min-w-0 flex-col items-center gap-4 text-sm text-balance",
        className
      )}
      {...props}
    />
  );
}

export function ProblemActions({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="problem-actions"
      className={cn(
        "flex w-full max-w-sm flex-col items-center justify-center gap-3 sm:flex-row sm:flex-wrap",
        className
      )}
      {...props}
    />
  );
}
