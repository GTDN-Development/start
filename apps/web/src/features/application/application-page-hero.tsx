import { useRender } from "@base-ui/react/use-render";

import { cn } from "@/lib/utils";
import { ContainerProps, containerVariants } from "@/components/ui/container";

function ApplicationPageHero({ className, render, ...props }: useRender.ComponentProps<"section">) {
  return useRender({
    render,
    defaultTagName: "section",
    props: {
      ...props,
      className: cn(className),
    },
  });
}

function ApplicationPageHeroTitle({ className, render, ...props }: useRender.ComponentProps<"h1">) {
  return useRender({
    render,
    defaultTagName: "h1",
    props: {
      ...props,
      className: cn(
        "font-heading text-3xl/[1.1] font-semibold tracking-tight text-pretty sm:text-4xl/[1.1]",
        className
      ),
    },
  });
}

function ApplicationPageHeroDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<"p">) {
  return useRender({
    render,
    defaultTagName: "p",
    props: {
      ...props,
      className: cn("text-muted-foreground text-sm text-pretty sm:text-base", className),
    },
  });
}

function ApplicationPageHeroContent({ className, size, render, ...props }: ContainerProps) {
  return useRender({
    render,
    defaultTagName: "div",
    props: {
      ...props,
      className: cn(containerVariants({ size }), "relative z-10 space-y-3 py-6 sm:py-8", className),
    },
  });
}

export {
  ApplicationPageHero,
  ApplicationPageHeroTitle,
  ApplicationPageHeroDescription,
  ApplicationPageHeroContent,
};
