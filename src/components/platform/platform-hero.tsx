import { useRender } from "@base-ui/react/use-render";

import { cn } from "@/lib/utils";
import { ContainerProps, containerVariants } from "../ui/container";

function PlatformHero({ className, render, ...props }: useRender.ComponentProps<"section">) {
  return useRender({
    render,
    defaultTagName: "section",
    props: {
      ...props,
      className: cn(className),
    },
  });
}

function PlatformHeroTitle({ className, render, ...props }: useRender.ComponentProps<"h1">) {
  return useRender({
    render,
    defaultTagName: "h1",
    props: {
      ...props,
      className: cn(
        "text-3xl/[1.1] font-semibold tracking-tight text-pretty sm:text-4xl/[1.1]",
        className
      ),
    },
  });
}

function PlatformHeroDescription({ className, render, ...props }: useRender.ComponentProps<"p">) {
  return useRender({
    render,
    defaultTagName: "p",
    props: {
      ...props,
      className: cn("text-muted-foreground text-sm text-pretty sm:text-base", className),
    },
  });
}

function PlatformHeroContent({ className, size, render, ...props }: ContainerProps) {
  return useRender({
    render,
    defaultTagName: "div",
    props: {
      ...props,
      className: cn(
        containerVariants({ size }),
        "relative z-10 space-y-3 py-6 sm:py-10",
        className
      ),
    },
  });
}

export { PlatformHero, PlatformHeroTitle, PlatformHeroDescription, PlatformHeroContent };
