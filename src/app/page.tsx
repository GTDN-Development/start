import { ContactForm } from "@/components/home-page/contact-form";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  Hero,
  HeroActions,
  HeroBackground,
  HeroBackgroundGrid,
  HeroContent,
  HeroDescription,
  HeroTitle,
} from "@/components/ui/hero";

import CubeSvg from "@/assets/svgs/cube.svg";

export default function Page() {
  return (
    <div>
      <Hero>
        <HeroBackground>
          <HeroBackgroundGrid />
        </HeroBackground>
        <HeroContent>
          <CubeSvg className="mx-auto h-auto w-20 dark:invert" />
          <HeroTitle>Home page</HeroTitle>
          <HeroDescription>
            Lorem ipsum dolor sit, amet consectetur adipisicing elit. A, fugit?
          </HeroDescription>
          <HeroActions>
            <Button size="lg">Learn more</Button>
            <Button size="lg" variant="secondary">
              Shadcn ui
            </Button>
          </HeroActions>
        </HeroContent>
      </Hero>

      <Container size="sm" className="pb-24">
        <ContactForm />
      </Container>
    </div>
  );
}
