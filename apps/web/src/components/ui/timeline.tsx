import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const timelineItemVariants = cva("grid gap-6 py-8 md:gap-8 md:py-10 lg:gap-12 lg:py-16", {
  variants: {
    layout: {
      default:
        "md:grid-cols-[minmax(0,10rem)_minmax(0,1fr)] lg:grid-cols-[minmax(0,14rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,15rem)_minmax(0,1fr)]",
    },
  },
  defaultVariants: {
    layout: "default",
  },
});

function Timeline({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="timeline" className={cn(className)} {...props} />;
}

function TimelineItem({
  className,
  layout,
  ...props
}: React.ComponentProps<"article"> & VariantProps<typeof timelineItemVariants>) {
  return (
    <article
      data-slot="timeline-item"
      className={cn(timelineItemVariants({ layout }), className)}
      {...props}
    />
  );
}

function TimelineAside({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="timeline-aside" className={cn("md:pr-6 lg:pr-8", className)} {...props} />;
}

function TimelineStickyAside({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="timeline-sticky-aside"
      className={cn("md:sticky md:top-22 xl:top-24", className)}
      {...props}
    />
  );
}

function TimelineContent({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="timeline-content" className={cn("max-w-2xl", className)} {...props} />;
}

export { Timeline, TimelineAside, TimelineContent, TimelineItem, TimelineStickyAside };
