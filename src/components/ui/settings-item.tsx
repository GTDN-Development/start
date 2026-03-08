import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/lib/utils";

function SettingsItem({
  className,
  render,
  variant,
  ...props
}: useRender.ComponentProps<"section"> & { variant?: "default" | "destructive" }) {
  return useRender({
    render,
    defaultTagName: "section",
    props: {
      ...props,
      "data-variant": variant,
      className: cn(
        "group/settings-item data-[variant=default]:border-border data-[variant=destructive]:border-destructive overflow-clip rounded-xl border",
        className
      ),
    },
  });
}

function SettingsItemTitle({ className, render, ...props }: useRender.ComponentProps<"h3">) {
  return useRender({
    render,
    defaultTagName: "h3",
    props: {
      ...props,
      className: cn(
        "text-lg/[1.1] font-semibold tracking-tight text-pretty sm:text-xl/[1.1]",
        className
      ),
    },
  });
}

function SettingsItemDescription({ className, render, ...props }: useRender.ComponentProps<"p">) {
  return useRender({
    render,
    defaultTagName: "p",
    props: {
      ...props,
      className: cn("text-muted-foreground text-sm text-pretty sm:text-base", className),
    },
  });
}

function SettingsItemContent({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("bg-card p-4 sm:p-6", className)}>
      {children}
    </div>
  );
}

function SettingsItemContentHeader({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("flex flex-col gap-4", className)}>
      {children}
    </div>
  );
}

function SettingsItemContentBody({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={className}>
      {children}
    </div>
  );
}

function SettingsItemFooter({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "group-data-[variant=destructive]/settings-item:bg-destructive/12.5 bg-background group-data-[variant=destructive]/settings-item:border-t-destructive/30 flex flex-col items-center justify-center gap-2 border-t px-4 py-2.5 text-center sm:flex-row sm:flex-wrap sm:justify-between sm:px-6 sm:py-3 sm:text-left",
        className
      )}
    >
      {children}
    </div>
  );
}

export {
  SettingsItem,
  SettingsItemTitle,
  SettingsItemDescription,
  SettingsItemContent,
  SettingsItemContentHeader,
  SettingsItemContentBody,
  SettingsItemFooter,
};
