import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { ComponentsShowcase } from "@/components/(dev)/components/components-showcase";

export const metadata: Metadata = {
  title: "Component Playground",
  description: "Development-only playground for UI components.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function Page() {
  return (
    <div>
      <Hero>
        <HeroContent size="sm">
          <HeroTitle>UI Components</HeroTitle>
          <HeroDescription>
            A quick visual checklist for the shadcn/ui components in this project. Use it to inspect
            variants, sizes, and accessibility states while building new screens.
          </HeroDescription>
        </HeroContent>
      </Hero>

      <Container className="pb-24">
        <ComponentsShowcase />
      </Container>
    </div>
  );
}
