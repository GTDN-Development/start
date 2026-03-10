import Image from "next/image";
import type { Metadata } from "next";
import { Locale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { Container } from "@/components/ui/container";
import { Hero, HeroContent, HeroDescription, HeroTitle } from "@/components/ui/hero";
import { Link } from "@/components/ui/link";
import { site } from "@/config/site";
import { getPathname } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getAllPosts, getPostBySlug, stripHtmlTags } from "@/server/blog/blog-api";

export const revalidate = 180;

export async function generateStaticParams() {
  const [csPosts, enPosts] = await Promise.all([getAllPosts("cs"), getAllPosts("en")]);
  return [...csPosts, ...enPosts].map((post) => ({ slug: post.slug }));
}

export async function generateMetadata(
  props: PageProps<"/[locale]/blog/[slug]">
): Promise<Metadata> {
  const { locale, slug } = await props.params;
  const post = await getPostBySlug(slug, locale as "cs" | "en");

  if (!post) {
    return {};
  }

  const title = stripHtmlTags(post.title);
  const description = stripHtmlTags(post.excerpt);
  const href = { pathname: "/blog/[slug]" as const, params: { slug } };

  return {
    title,
    description,
    alternates: {
      canonical: getPathname({ href, locale: locale as Locale }),
      languages: Object.fromEntries(
        routing.locales.map((l) => [l, getPathname({ href, locale: l })])
      ),
    },
    openGraph: {
      type: "article",
      siteName: site.name,
      title,
      description,
      publishedTime: post.date,
      images: post.coverImage
        ? [{ url: post.coverImage.url, alt: post.coverImage.alt }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.coverImage ? [post.coverImage.url] : undefined,
    },
  };
}

export default async function Page({ params }: PageProps<"/[locale]/blog/[slug]">) {
  const { locale, slug } = await params;

  setRequestLocale(locale as Locale);

  const [t, post] = await Promise.all([
    getTranslations({ locale: locale as Locale, namespace: "pages.blog" }),
    getPostBySlug(slug, locale as "cs" | "en"),
  ]);

  if (!post) {
    notFound();
  }

  const formattedDate = new Date(post.date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <article>
      <Hero>
        <HeroContent size="md">
          <Link
            href="/blog"
            className="text-muted-foreground hover:text-foreground mb-6 flex items-center justify-center gap-1.5 text-sm transition-colors"
          >
            <ArrowLeftIcon aria-hidden="true" className="size-4" />
            {t("backToBlog")}
          </Link>
          <HeroTitle render={<h1 />}>{stripHtmlTags(post.title)}</HeroTitle>
          {post.excerpt && <HeroDescription>{stripHtmlTags(post.excerpt)}</HeroDescription>}
          <p className="text-muted-foreground mt-4 text-center text-sm">
            <time dateTime={post.date}>{formattedDate}</time>
          </p>
        </HeroContent>
      </Hero>

      {post.coverImage ? (
        <Container className="mt-8">
          <Image
            src={post.coverImage.url}
            alt={post.coverImage.alt}
            width={1200}
            height={480}
            className="max-h-120 w-full rounded-xl object-cover"
            priority
          />
        </Container>
      ) : (
        <Container size="prose">
          <hr className="opacity-30" />
        </Container>
      )}

      <Container size="prose" className="mt-12 pb-24">
        <div
          className="prose prose-neutral dark:prose-invert max-w-none"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </Container>
    </article>
  );
}
