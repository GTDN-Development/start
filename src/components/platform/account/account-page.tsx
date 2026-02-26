import { cn } from "@/lib/utils";

export function AccountPage({
  title,
  description,
  children,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  title?: string;
  description?: string;
}) {
  return (
    <div {...props} className={cn("", className)}>
      {title && (
        <section className="pb-6">
          {title && (
            <h2 className="text-xl/[1.1] font-semibold tracking-tight text-pretty sm:text-2xl/[1.1]">
              {title}
            </h2>
          )}
          {description && <p className="text-muted-foreground mt-2">{description}</p>}
        </section>
      )}
      <div>{children}</div>
    </div>
  );
}
