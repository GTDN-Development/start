import { cn } from "@/lib/utils";

type SettingsPageProps = React.ComponentProps<"section"> & {
  title?: string;
  description?: string;
};

export function SettingsPage({
  title,
  description,
  children,
  className,
  ...props
}: SettingsPageProps) {
  return (
    <section {...props} className={cn(className)}>
      {(title || description) && (
        <header className="pb-6">
          {title && (
            <h1 className="font-heading text-xl/[1.1] font-semibold tracking-tight text-pretty sm:text-2xl/[1.1]">
              {title}
            </h1>
          )}
          {description && <p className="text-muted-foreground mt-2">{description}</p>}
        </header>
      )}
      <div>{children}</div>
    </section>
  );
}
