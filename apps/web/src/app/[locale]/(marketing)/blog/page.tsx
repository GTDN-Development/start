import { Suspense } from "react";
import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { connection } from "next/server";
import { NewspaperIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { Skeleton } from "@/components/ui/skeleton";
import { createPublicPageMetadata } from "@/lib/metadata";
import { getAllPosts } from "@/server/blog/blog-api";
import { BlogPostGrid } from "@/features/marketing/blog/blog-post-grid";

export async function generateMetadata(props: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.blog",
  });

  return createPublicPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/blog",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/blog">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const t = await getTranslations({ locale: locale as Locale, namespace: "pages.blog" });
  const emptyTitle = t.has("empty.title") ? t("empty.title") : t("title");
  const emptyDescription = t.has("empty.description") ? t("empty.description") : t("description");

  return (
    <div className="relative">
      <Hero>
        <HeroContent size="md">
          <HeroTitle>{t("title")}</HeroTitle>
          <HeroDescription>{t("description")}</HeroDescription>
        </HeroContent>
      </Hero>

      <div className="pb-24">
        <Container render={<section />}>
          <Suspense fallback={<BlogPostsFallback />}>
            <BlogPosts
              locale={locale as "cs" | "en"}
              emptyTitle={emptyTitle}
              emptyDescription={emptyDescription}
            />
          </Suspense>
        </Container>
      </div>
    </div>
  );
}

async function BlogPosts({
  locale,
  emptyTitle,
  emptyDescription,
}: {
  locale: "cs" | "en";
  emptyTitle: string;
  emptyDescription: string;
}) {
  await connection();

  const posts = await getAllPosts(locale);

  if (posts.length > 0) {
    return <BlogPostGrid posts={posts} />;
  }

  return <BlogEmptyState emptyTitle={emptyTitle} emptyDescription={emptyDescription} />;
}

function BlogPostsFallback() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="overflow-hidden rounded-lg">
          <Skeleton className="aspect-video w-full rounded-none" />
          <div className="grid gap-3 p-6">
            <div className="flex items-center gap-1.5">
              <Skeleton className="size-3.5 rounded-sm" />
              <Skeleton className="h-3 w-24" />
            </div>
            <div className="grid gap-2">
              <Skeleton className="h-5 w-11/12" />
              <Skeleton className="h-5 w-3/4" />
            </div>
          </div>
          <div className="grid gap-4 px-6 pb-6">
            <div className="grid gap-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-10/12" />
              <Skeleton className="h-4 w-2/3" />
            </div>
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

function BlogEmptyState({
  emptyTitle,
  emptyDescription,
}: {
  emptyTitle: string;
  emptyDescription: string;
}) {
  return (
    <Empty className="border-border bg-card/40">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <NewspaperIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>{emptyTitle}</EmptyTitle>
        <EmptyDescription>{emptyDescription}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
