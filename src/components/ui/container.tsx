import { useRender } from "@base-ui/react/use-render";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

export const containerVariants = cva(
  [
    "mx-auto",
    "[--container-padding:--spacing(6)]",
    "w-[min(var(--container-max-width),100%-var(--container-padding)*2)]",
  ],
  {
    variants: {
      size: {
        sm: "[--container-max-width:var(--breakpoint-sm)]", // 40rem (640px)
        md: "[--container-max-width:var(--breakpoint-md)]", // 48rem (768px)
        lg: "[--container-max-width:var(--breakpoint-lg)]", // 64rem (1024px)
        xl: "[--container-max-width:var(--breakpoint-xl)]", // 80rem (1280px)
        "2xl": "[--container-max-width:var(--breakpoint-2xl)]", // 96rem (1536px)
        prose: "[--container-max-width:65ch]", // ~65 characters
        default: "[--container-max-width:var(--breakpoint-2xl)]", // Default: --breakpoint-2xl -> 96rem (1536px)
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export type ContainerProps = useRender.ComponentProps<"div"> &
  VariantProps<typeof containerVariants>;

export function Container({
  className,
  size,
  render,
  ...props
}: ContainerProps) {
  return useRender({
    render,
    defaultTagName: "div",
    props: {
      ...props,
      className: cn(containerVariants({ size, className })),
    },
  });
}
