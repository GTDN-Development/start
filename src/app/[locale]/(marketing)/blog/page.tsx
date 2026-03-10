import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { createPageMetadata } from "@/lib/metadata";
import { getAllPosts } from "@/server/blog/blog-api";
import { BlogPostGrid } from "@/features/marketing/blog/blog-post-grid";

export async function generateMetadata(props: PageProps<"/[locale]/blog">): Promise<Metadata> {
  const { locale } = await props.params;

  const t = await getTranslations({
    locale: locale as Locale,
    namespace: "pages.blog",
  });

  return createPageMetadata({
    title: t("title"),
    description: t("description"),
    locale: locale as Locale,
    pathname: "/blog",
  });
}

export default async function Page({ params }: PageProps<"/[locale]/blog">) {
  const { locale } = await params;

  setRequestLocale(locale as Locale);

  const [t, posts] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "pages.blog" }),
    getAllPosts(locale as "cs" | "en"),
  ]);

  if (posts.length === 0) {
    notFound();
  }

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
          <BlogPostGrid posts={posts} />
        </Container>
      </div>
    </div>
  );
}
