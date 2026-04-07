import { Container } from "@/components/ui/container";
import { Skeleton } from "@/components/ui/skeleton";
import { Hero, HeroContent } from "@/components/ui/hero";

export function BlogPostPageSkeleton() {
  return (
    <article>
      <Hero>
        <HeroContent size="md">
          <Skeleton className="mb-6 h-4 w-28" />
          <Skeleton className="mx-auto h-10 w-full max-w-2xl sm:h-12" />
          <Skeleton className="mx-auto mt-4 h-4 w-full max-w-xl" />
          <Skeleton className="mx-auto mt-4 h-4 w-32" />
        </HeroContent>
      </Hero>

      <Container className="mt-8">
        <Skeleton className="h-72 w-full rounded-xl sm:h-96" />
      </Container>

      <Container size="prose" className="mt-12 pb-24">
        <div className="grid gap-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="mt-4 h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
        </div>
      </Container>
    </article>
  );
}
