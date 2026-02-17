import { Container } from "@/components/ui/container";
import {
  Hero,
  HeroBackground,
  HeroContent,
  HeroDescription,
  HeroTitle,
} from "@/components/ui/hero";
import { PatternGrid } from "@/components/ui/patterns";

type MarketingPlaceholderPageProps = {
  title: string;
  description: string;
  contentTitle: string;
  contentDescription: string;
};

export function MarketingPlaceholderPage({
  title,
  description,
  contentTitle,
  contentDescription,
}: MarketingPlaceholderPageProps) {
  return (
    <div>
      <Hero>
        <HeroBackground>
          <PatternGrid className="absolute inset-0 -z-10 size-full opacity-55" />
        </HeroBackground>
        <HeroContent size="md">
          <HeroTitle>{title}</HeroTitle>
          <HeroDescription>{description}</HeroDescription>
        </HeroContent>
      </Hero>

      <Container size="md" className="pb-24">
        <section className="border-border bg-card/60 rounded-2xl border border-dashed p-8 text-center">
          <h2 className="text-xl font-semibold tracking-tight">{contentTitle}</h2>
          <p className="text-muted-foreground mt-3 text-sm text-pretty sm:text-base">
            {contentDescription}
          </p>
        </section>
      </Container>
    </div>
  );
}
