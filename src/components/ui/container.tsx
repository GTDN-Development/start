import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const containerVariants = cva("mx-auto w-[min(var(--container-max-width),100%---spacing(10))]", {
  variants: {
    size: {
      sm: "[--container-max-width:48rem]",
      default: "[--container-max-width:64rem]",
      lg: "[--container-max-width:92rem]",
      prose: "[--container-max-width:65ch]",
      fluid: "[--container-max-width:100%]",
    },
  },
  defaultVariants: {
    size: "default",
  },
});

function Container({
  className,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof containerVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "div";

  return <Comp className={cn(containerVariants({ size, className }))} {...props} />;
}

export type ContainerProps<T extends React.ElementType = "div"> = React.ComponentProps<T> &
  VariantProps<typeof containerVariants> & {
    asChild?: boolean;
  };

export { Container, containerVariants };
