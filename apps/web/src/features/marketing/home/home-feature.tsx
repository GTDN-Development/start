import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/lib/utils";

/**
 *   <HomeFeature>
 *     <HomeFeatureHeader>
 *       <HomeFeatureTitle>…</HomeFeatureTitle>
 *       <HomeFeatureHeaderAside>
 *         <HomeFeatureDescription>…</HomeFeatureDescription>
 *         <a href="…">2.0 Plan →</a>
 *       </HomeFeatureHeaderAside>
 *     </HomeFeatureHeader>
 *     <HomeFeatureMedia>…screenshot…</HomeFeatureMedia>
 *     <HomeFeatureSubLinks>
 *       <a href="…">2.1 Projects</a>
 *       <a href="…">2.2 Documents</a>
 *     </HomeFeatureSubLinks>
 *   </HomeFeature>
 *
 */

function HomeFeature({ className, render, ...props }: useRender.ComponentProps<"section">) {
  return useRender({
    render,
    defaultTagName: "section",
    props: {
      ...props,
      className: cn("flex flex-col gap-8 sm:gap-12", className),
    },
  });
}

function HomeFeatureHeader({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-12", className)}>
      {children}
    </div>
  );
}

function HomeFeatureTitle({ className, render, ...props }: useRender.ComponentProps<"h2">) {
  return useRender({
    render,
    defaultTagName: "h2",
    props: {
      ...props,
      className: cn(
        "font-heading text-3xl font-bold tracking-tight text-pretty sm:text-4xl lg:text-5xl",
        className
      ),
    },
  });
}

function HomeFeatureHeaderAside({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("flex flex-col items-start justify-center gap-4", className)}>
      {children}
    </div>
  );
}

function HomeFeatureDescription({ className, render, ...props }: useRender.ComponentProps<"p">) {
  return useRender({
    render,
    defaultTagName: "p",
    props: {
      ...props,
      className: cn("text-muted-foreground text-base text-pretty sm:text-lg", className),
    },
  });
}

function HomeFeatureMedia({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("overflow-hidden rounded-xl border", className)}>
      {children}
    </div>
  );
}

function HomeFeatureSubLinks({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("grid grid-cols-2 gap-x-8 gap-y-2 sm:grid-cols-4", className)}>
      {children}
    </div>
  );
}

export {
  HomeFeature,
  HomeFeatureHeader,
  HomeFeatureTitle,
  HomeFeatureHeaderAside,
  HomeFeatureDescription,
  HomeFeatureMedia,
  HomeFeatureSubLinks,
};
