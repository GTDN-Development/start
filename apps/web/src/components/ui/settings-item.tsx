import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/lib/utils";

/**
 * SettingsItem — a compound component for building settings panels.
 *
 * Composition:
 *
 *   <SettingsItem variant="default | destructive">
 *     <SettingsItemContent>
 *       <SettingsItemContentHeader>
 *         <SettingsItemTitle>…</SettingsItemTitle>
 *         <SettingsItemDescription>…</SettingsItemDescription>
 *       </SettingsItemContentHeader>
 *       <SettingsItemContentBody>
 *         <SettingsItemList>
 *           <SettingsItemListItem>
 *             <SettingsItemListMedia>…icon…</SettingsItemListMedia>
 *             <SettingsItemListContent>
 *               <SettingsItemListTitle>…</SettingsItemListTitle>
 *               <SettingsItemListDescription>…</SettingsItemListDescription>
 *             </SettingsItemListContent>
 *             <SettingsItemListAction>…button…</SettingsItemListAction>
 *           </SettingsItemListItem>
 *         </SettingsItemList>
 *       </SettingsItemContentBody>
 *     </SettingsItemContent>
 *     <SettingsItemFooter>
 *       <SettingsItemDescription>…</SettingsItemDescription>
 *       <Button>…</Button>
 *     </SettingsItemFooter>
 *   </SettingsItem>
 *
 * Example (Your Devices):
 *
 *   <SettingsItem>
 *     <SettingsItemContent className="flex flex-col gap-6">
 *       <SettingsItemContentHeader>
 *         <SettingsItemTitle>Your Devices</SettingsItemTitle>
 *         <SettingsItemDescription>
 *           Devices where you are currently logged in.
 *         </SettingsItemDescription>
 *       </SettingsItemContentHeader>
 *       <SettingsItemContentBody>
 *         <SettingsItemList>
 *           <SettingsItemListItem>
 *             <SettingsItemListMedia><LaptopIcon aria-hidden="true" /></SettingsItemListMedia>
 *             <SettingsItemListContent>
 *               <SettingsItemListTitle>Mac OS - Safari</SettingsItemListTitle>
 *               <SettingsItemListDescription>Prague - 2025-02-28</SettingsItemListDescription>
 *             </SettingsItemListContent>
 *             <SettingsItemListAction><Button variant="secondary">Sign out</Button></SettingsItemListAction>
 *           </SettingsItemListItem>
 *         </SettingsItemList>
 *       </SettingsItemContentBody>
 *     </SettingsItemContent>
 *     <SettingsItemFooter>
 *       <SettingsItemDescription>Sign out of all other devices.</SettingsItemDescription>
 *       <Button size="lg">Sign out from all devices</Button>
 *     </SettingsItemFooter>
 *   </SettingsItem>
 *
 */

function SettingsItem({
  className,
  render,
  variant,
  disabled = false,
  ...props
}: useRender.ComponentProps<"section"> & {
  variant?: "default" | "destructive";
  disabled?: boolean;
}) {
  const element = useRender({
    render,
    defaultTagName: "section",
    props: {
      ...props,
      "data-variant": variant,
      "data-disabled": disabled ? "true" : undefined,
      "aria-disabled": disabled || undefined,
      inert: disabled || undefined,
      className: cn(
        "group/settings-item data-[variant=default]:border-border data-[variant=destructive]:border-destructive/50 relative overflow-clip rounded-xl border data-[disabled=true]:opacity-50 data-[disabled=true]:select-none",
        className
      ),
    },
  });

  if (disabled) {
    return <div className="cursor-not-allowed">{element}</div>;
  }

  return element;
}

function SettingsItemTitle({ className, render, ...props }: useRender.ComponentProps<"h3">) {
  return useRender({
    render,
    defaultTagName: "h3",
    props: {
      ...props,
      className: cn(
        "font-heading text-lg/[1.1] font-semibold tracking-tight text-pretty sm:text-xl/[1.1]",
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
        "group-data-[variant=destructive]/settings-item:bg-destructive/10 bg-background group-data-[variant=destructive]/settings-item:border-t-destructive/30 flex flex-col items-center justify-center gap-2 border-t px-4 py-2.5 text-center sm:flex-row sm:flex-wrap sm:justify-between sm:px-6 sm:py-3 sm:text-left",
        className
      )}
    >
      {children}
    </div>
  );
}

// Inner List

function SettingsItemList({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn("bg-background @container divide-y rounded-lg border", className)}
    >
      {children}
    </div>
  );
}

function SettingsItemListItem({ children, className, ...props }: React.ComponentProps<"div">) {
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

function SettingsItemListMedia({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      {...props}
      className={cn(
        "relative flex items-center justify-center [&_svg:not([class*='size-'])]:size-5",
        className
      )}
    >
      {children}
    </div>
  );
}

function SettingsItemListTitle({ className, render, ...props }: useRender.ComponentProps<"h3">) {
  return useRender({
    render,
    defaultTagName: "h3",
    props: {
      ...props,
      className: cn("font-heading text-sm font-semibold", className),
    },
  });
}

function SettingsItemListDescription({
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

function SettingsItemListContent({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("flex flex-col gap-1", className)}>
      {children}
    </div>
  );
}

function SettingsItemListAction({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("@xs:ml-auto", className)}>
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

  // Inner list
  SettingsItemList,
  SettingsItemListItem,
  SettingsItemListMedia,
  SettingsItemListTitle,
  SettingsItemListDescription,
  SettingsItemListContent,
  SettingsItemListAction,
};
