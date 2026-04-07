import { cn } from "@/lib/utils";

export function DescriptionList({ className, ...props }: React.ComponentPropsWithoutRef<"dl">) {
  return (
    <dl
      {...props}
      className={cn(
        "grid grid-cols-1 text-sm/6 sm:grid-cols-[min(50%,--spacing(80))_auto]",
        className
      )}
    />
  );
}

export function DescriptionTerm({ className, ...props }: React.ComponentPropsWithoutRef<"dt">) {
  return (
    <dt
      {...props}
      className={cn(
        "text-foreground/80 col-start-1 border-t pt-3 first:border-none sm:border-t sm:py-3",
        className
      )}
    />
  );
}

export function DescriptionDetails({ className, ...props }: React.ComponentPropsWithoutRef<"dd">) {
  return (
    <dd
      {...props}
      className={cn(
        "text-foreground sm:border-border pt-1 pb-3 sm:border-t sm:py-3 sm:nth-2:border-none",
        className
      )}
    />
  );
}
