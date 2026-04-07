import * as React from "react";

import { cn } from "@/lib/utils";

function Placeholder({ className, ...props }: React.ComponentProps<"section">) {
  return (
    <section
      data-slot="placeholder"
      className={cn(
        "border-border bg-card/60 text-card-foreground rounded-xl border border-dashed px-4 py-32 text-center sm:px-6",
        className
      )}
      {...props}
    />
  );
}

function PlaceholderTitle({ className, ...props }: React.ComponentProps<"h2">) {
  return (
    <h2
      data-slot="placeholder-title"
      className={cn("font-heading text-xl font-semibold tracking-tight sm:text-2xl", className)}
      {...props}
    />
  );
}

function PlaceholderDescription({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="placeholder-description"
      className={cn("text-muted-foreground mt-3 text-sm text-pretty sm:text-base", className)}
      {...props}
    />
  );
}

export { Placeholder, PlaceholderTitle, PlaceholderDescription };
