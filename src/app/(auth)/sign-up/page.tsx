import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { Link } from "@/components/ui/link";
import { SignUpForm } from "@/components/(auth)/sign-up/sign-up-form";
import { site } from "@/config/site";

const title = "Sign up";
const description = "Create a new account to start using the platform.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/sign-up",
  },
  openGraph: {
    title: `${title} | ${site.name}`,
    description,
    url: `${site.url}/sign-up`,
  },
  twitter: {
    title: `${title} | ${site.name}`,
    description,
  },
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
          <HeroTitle>{title}</HeroTitle>
          <HeroDescription>{description}</HeroDescription>
        </HeroContent>
      </Hero>

      <Container size="sm" className="pb-24">
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold">Create your account</h2>
          </CardHeader>
          <CardContent>
            <SignUpForm />
            <p className="mt-6 text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline hover:no-underline">
                Log in
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
