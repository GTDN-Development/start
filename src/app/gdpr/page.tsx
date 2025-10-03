import { GdprPolicy } from "@/components/gdpr/gdpr-policy";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { legal } from "@/config/legal";

export default function Page() {
  return (
    <>
      <Hero>
        <HeroContent>
          <HeroTitle>Privacy Policy</HeroTitle>
          <HeroDescription>
            Information about the processing of personal data in accordance with the GDPR regulation
          </HeroDescription>
        </HeroContent>
      </Hero>

      <Container size="sm" className="prose pb-24">
        <GdprPolicy
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
          effectiveDate="1. January 2025"
          locale="en"
        />
      </Container>
    </>
  );
}
