import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { ColorsShowcase } from "@/components/(dev)/colors/colors-showcase";

export const metadata: Metadata = {
  title: "Theme Colors",
  description: "Development-only palette reference for theme tokens.",
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
          <HeroTitle>Theme Colors</HeroTitle>
          <HeroDescription>
            These tokens come directly from globals.css and mirror the shadcn/ui theming model. Use
            the descriptions below as a quick reminder for where each color belongs.
          </HeroDescription>
        </HeroContent>
      </Hero>

      <Container className="pb-24">
        <ColorsShowcase />
      </Container>
    </div>
  );
}
