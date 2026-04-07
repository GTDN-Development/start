import { useRender } from "@base-ui/react/use-render";

import { cn } from "@/lib/utils";

function AuthHero({ className, render, ...props }: useRender.ComponentProps<"section">) {
  return useRender({
    render,
    defaultTagName: "section",
    props: {
      ...props,
      className: cn(className),
    },
  });
}

function AuthHeroTitle({ className, render, ...props }: useRender.ComponentProps<"h1">) {
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

function AuthHeroDescription({ className, render, ...props }: useRender.ComponentProps<"p">) {
  return useRender({
    render,
    defaultTagName: "p",
    props: {
      ...props,
      className: cn("text-muted-foreground text-sm text-pretty sm:text-base", className),
    },
  });
}

function AuthHeroContent({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    render,
    defaultTagName: "div",
    props: {
      ...props,
      className: cn("space-y-3 text-center", className),
    },
  });
}

export { AuthHero, AuthHeroTitle, AuthHeroDescription, AuthHeroContent };
