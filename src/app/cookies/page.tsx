import { CookiePolicy } from "@/components/cookies/cookie-policy";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { legal } from "@/config/legal";
import { cookies } from "@/config/cookies";

export default function Page() {
  return (
    <>
      <Hero>
        <HeroContent>
          <HeroTitle>Cookie Policy</HeroTitle>
          <HeroDescription>
            Learn about how we use cookies on our website, what types of cookies we use, and how you
            can manage your cookie preferences.
          </HeroDescription>
        </HeroContent>
      </Hero>

      <Container size="sm" className="prose pb-24">
        <CookiePolicy
          company={{
            name: legal.legalName,
            address: legal.address,
            id: legal.id,
            domain: legal.domain,
          }}
          contact={{
            email: legal.contact.email,
            phone: legal.contact.phone,
          }}
          cookies={cookies}
          effectiveDate="1. January 2025"
          locale="en"
        />
      </Container>
    </>
  );
}
