import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { Link } from "@/components/ui/link";
import { LoginForm } from "@/components/(auth)/login/login-form";
import { site } from "@/config/site";

const title = "Log in";
const description = "Access your account to manage settings and preferences.";

export const metadata: Metadata = {
  title,
  description,
  alternates: {
    canonical: "/login",
  },
  openGraph: {
    title: `${title} | ${site.name}`,
    description,
    url: `${site.url}/login`,
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
            <h2 className="text-2xl font-bold">Welcome back</h2>
          </CardHeader>
          <CardContent>
            <LoginForm />
            <p className="mt-6 text-sm">
              New here?{" "}
              <Link href="/sign-up" className="underline hover:no-underline">
                Create an account
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      </Container>
    </div>
  );
}
