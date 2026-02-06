import { useRender } from "@base-ui/react/use-render";

import { cn } from "@/lib/utils";
import { containerVariants, type ContainerProps } from "./container";

function Hero({
  className,
  render,
  ...props
}: useRender.ComponentProps<"header">) {
  return useRender({
    render,
    defaultTagName: "header",
    props: {
      ...props,
      className: cn("bg-background text-foreground relative isolate overflow-hidden", className),
    },
  });
}

function HeroBackground({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    render,
    defaultTagName: "div",
    props: {
      ...props,
      className: cn("absolute inset-0 -z-10 size-full", className),
    },
  });
}

function HeroContent({ className, size, render, ...props }: ContainerProps) {
  return useRender({
    render,
    defaultTagName: "div",
    props: {
      ...props,
      className: cn(containerVariants({ size }), "relative z-10 py-12 sm:py-20", className),
    },
  });
}

function HeroTitle({
  className,
  render,
  ...props
}: useRender.ComponentProps<"h1">) {
  return useRender({
    render,
    defaultTagName: "h1",
    props: {
      ...props,
      className: cn(
        "text-foreground mt-3 text-center text-3xl/[110%] font-semibold tracking-tight text-pretty sm:text-4xl/[110%] sm:leading-none lg:text-5xl/[110%]",
        className
      ),
    },
  });
}

function HeroDescription({
  className,
  render,
  ...props
}: useRender.ComponentProps<"p">) {
  return useRender({
    render,
    defaultTagName: "p",
    props: {
      ...props,
      className: cn(
        "text-muted-foreground mx-auto mt-4 max-w-prose text-center text-lg font-medium text-pretty",
        className
      ),
    },
  });
}

function HeroActions({
  className,
  render,
  ...props
}: useRender.ComponentProps<"div">) {
  return useRender({
    render,
    defaultTagName: "div",
    props: {
      ...props,
      className: cn(
        "mt-6 flex w-full flex-col items-center justify-end gap-3 *:w-full sm:flex-row sm:justify-center sm:*:w-auto",
        className
      ),
    },
  });
}

export { Hero, HeroBackground, HeroContent, HeroTitle, HeroDescription, HeroActions };
