import { useRender } from "@base-ui/react/use-render";
import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 *   <HomeFeature>
 *     <HomeFeatureHeader>
 *       <HomeFeatureTitle>…</HomeFeatureTitle>
 *       <HomeFeatureHeaderAside>
 *         <HomeFeatureDescription>…</HomeFeatureDescription>
 *         <HomeFeatureLink href="…">2.0 Plan →</HomeFeatureLink>
 *       </HomeFeatureHeaderAside>
 *     </HomeFeatureHeader>
 *     <HomeFeatureMedia>…screenshot…</HomeFeatureMedia>
 *     <HomeFeatureSubLinks>
 *       <HomeFeatureSubLink href="…">2.1 Projects</HomeFeatureSubLink>
 *       <HomeFeatureSubLink href="…">2.2 Documents</HomeFeatureSubLink>
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
        "text-3xl font-bold tracking-tight text-pretty sm:text-4xl lg:text-5xl",
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

function HomeFeatureLink({ className, children, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={cn(
        "text-foreground hover:text-foreground/70 inline-flex items-center gap-1 text-sm font-medium transition-colors",
        className
      )}
    >
      {children}
    </Link>
  );
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

function HomeFeatureSubLink({ className, children, ...props }: React.ComponentProps<typeof Link>) {
  return (
    <Link
      {...props}
      className={cn(
        "text-muted-foreground hover:text-foreground text-sm transition-colors",
        className
      )}
    >
      {children}
    </Link>
  );
}

export {
  HomeFeature,
  HomeFeatureHeader,
  HomeFeatureTitle,
  HomeFeatureHeaderAside,
  HomeFeatureDescription,
  HomeFeatureLink,
  HomeFeatureMedia,
  HomeFeatureSubLinks,
  HomeFeatureSubLink,
};
