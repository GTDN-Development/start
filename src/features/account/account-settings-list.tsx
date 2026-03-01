import { cn } from "@/lib/utils";
import { useRender } from "@base-ui/react/use-render";

function AccountSettingsList({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn("bg-background @container divide-y rounded-lg border", className)}
    >
      {children}
    </div>
  );
}

function AccountSettingsListItem({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "flex flex-col items-center justify-start gap-5 px-4 py-5 text-center @xs:flex-row @xs:text-left",
        className
      )}
    >
      {children}
    </div>
  );
}

function AccountSettingsIconWrapper({
  children,
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "flex items-center justify-center [&_svg:not([class*='size-'])]:size-5",
        className
      )}
    >
      {children}
    </div>
  );
}

function AccountSettingsTitle({ className, render, ...props }: useRender.ComponentProps<"h3">) {
  return useRender({
    render,
    defaultTagName: "h3",
    props: {
      ...props,
      className: cn("text-sm font-semibold", className),
    },
  });
}

function AccountSettingsDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<"p">) {
  return useRender({
    render,
    defaultTagName: "p",
    props: {
      ...props,
      className: cn("text-muted-foreground text-sm", className),
    },
  });
}

function AccountSettingsContent({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("flex flex-col gap-1", className)}>
      {children}
    </div>
  );
}

function AccountSettingsActions({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("@xs:ml-auto", className)}>
      {children}
    </div>
  );
}

export {
  AccountSettingsList,
  AccountSettingsListItem,
  AccountSettingsIconWrapper,
  AccountSettingsTitle,
  AccountSettingsDescription,
  AccountSettingsContent,
  AccountSettingsActions,
};
