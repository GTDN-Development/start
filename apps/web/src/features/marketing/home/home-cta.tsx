import { useRender } from "@base-ui/react/use-render";
import { cn } from "@/lib/utils";

/**
 *   <HomeCta>
 *     <HomeCtaTitle>…</HomeCtaTitle>
 *     <HomeCtaDescription>…</HomeCtaDescription>
 *     <HomeCtaActions>
 *       <Button size="lg">…</Button>
 *       <Button size="lg" variant="secondary">…</Button>
 *     </HomeCtaActions>
 *   </HomeCta>
 *
 */

function HomeCta({ className, render, ...props }: useRender.ComponentProps<"section">) {
  return useRender({
    render,
    defaultTagName: "section",
    props: {
      ...props,
      className: cn("flex flex-col items-center gap-6 text-center", className),
    },
  });
}

function HomeCtaTitle({ className, render, ...props }: useRender.ComponentProps<"h2">) {
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

function HomeCtaDescription({ className, render, ...props }: useRender.ComponentProps<"p">) {
  return useRender({
    render,
    defaultTagName: "p",
    props: {
      ...props,
      className: cn(
        "text-muted-foreground max-w-prose text-base text-pretty sm:text-lg",
        className
      ),
    },
  });
}

function HomeCtaActions({ children, className, ...props }: React.ComponentProps<"div">) {
  return (
    <div {...props} className={cn("flex flex-wrap items-center justify-center gap-3", className)}>
      {children}
    </div>
  );
}

export { HomeCta, HomeCtaTitle, HomeCtaDescription, HomeCtaActions };
