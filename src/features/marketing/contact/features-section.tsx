import { Link } from "@/i18n/navigation";
import type { ComponentProps } from "react";
import { ArrowRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRender } from "@base-ui/react";

type FeaturesItem = {
  title: string;
  description: string;
  cta: string;
  href: ComponentProps<typeof Link>["href"];
};

const features: FeaturesItem[] = [
  {
    title: "Feature 1",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam ullamcorper nunc a lectus eleifend, sed laoreet nulla pretium.",
    cta: "CTA for feature 1",
    href: "/",
  },
  {
    title: "Feature 2",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam ullamcorper nunc a lectus eleifend, sed laoreet nulla pretium.",
    cta: "CTA for feature 2",
    href: "/",
  },
  {
    title: "Feature 3",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam ullamcorper nunc a lectus eleifend, sed laoreet nulla pretium.",
    cta: "CTA for feature 3",
    href: "/",
  },
  {
    title: "Feature 4",
    description:
      "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam ullamcorper nunc a lectus eleifend, sed laoreet nulla pretium.",
    cta: "CTA for feature 4",
    href: "/",
  },
];

export default function FeaturesSection() {
  return (
    <div className="grid grid-cols-2 gap-6">
      {features.map((feature) => (
        <FeaturesCard key={feature.title}>
          <FeaturesTitle>{feature.title}</FeaturesTitle>
          <FeaturesDescription>{feature.description}</FeaturesDescription>
          <Link
            href={feature.href}
            className="text-foreground hover:text-foreground/70 inline-flex items-center gap-1 text-sm font-medium transition-colors"
          >
            {feature.cta}
            <ArrowRightIcon className="size-4" aria-hidden="true" />
          </Link>
        </FeaturesCard>
      ))}
    </div>
  );
}

function FeaturesCard({ className, render, ...props }: useRender.ComponentProps<"div">) {
  return useRender({
    render,
    defaultTagName: "div",
    props: {
      ...props,
      className: cn("flex flex-col gap-4 p-6 sm:p-8", className),
    },
  });
}

function FeaturesTitle({ className, render, ...props }: useRender.ComponentProps<"h2">) {
  return useRender({
    render,
    defaultTagName: "h2",
    props: {
      ...props,
      className: cn("font-heading text-xl font-semibold tracking-tight", className),
    },
  });
}

function FeaturesDescription({ className, render, ...props }: useRender.ComponentProps<"p">) {
  return useRender({
    render,
    defaultTagName: "p",
    props: {
      ...props,
      className: cn("text-muted-foreground text-sm", className),
    },
  });
}
