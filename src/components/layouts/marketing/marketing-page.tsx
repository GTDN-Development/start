import { Hero, HeroActions, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { cn } from "@/lib/utils";

export function MarketingPage({
  children,
  className,
  hero,
  ...props
}: React.ComponentProps<"div"> & {
  hero?: {
    title?: string;
    description?: string;
    actions?: React.ReactNode;
  };
}) {
  return (
    <div {...props} className={cn("relative", className)}>
      {hero && (
        <Hero>
          <HeroContent size="md">
            {hero.title && <HeroTitle>{hero.title}</HeroTitle>}
            {hero.description && <HeroDescription>{hero.description}</HeroDescription>}
            {hero.actions && <HeroActions>{hero.actions}</HeroActions>}
          </HeroContent>
        </Hero>
      )}
      {children}
    </div>
  );
}
