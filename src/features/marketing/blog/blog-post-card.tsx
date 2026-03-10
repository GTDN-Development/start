import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { CalendarIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/server/blog/blog-api";

type BlogPostCardProps = {
  post: BlogPost;
};

export function BlogPostCard({ post }: BlogPostCardProps) {
  const t = useTranslations("pages.blog");
  const locale = useLocale();

  const formattedDate = new Date(post.date).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <Card className="relative h-full transition-shadow hover:shadow-md">
      {post.coverImage && (
        <Image
          src={post.coverImage.url}
          alt={post.coverImage.alt}
          width={800}
          height={450}
          className="aspect-video w-full object-cover"
        />
      )}
      <CardHeader>
        <div className="text-muted-foreground flex items-center gap-1.5 text-xs">
          <CalendarIcon aria-hidden="true" className="size-3.5" />
          <time dateTime={post.date}>{formattedDate}</time>
        </div>
        <CardTitle className="line-clamp-2 text-base leading-snug font-semibold">
          <Link
            href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }}
            className="after:absolute after:inset-0"
          >
            {post.title}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <p className="text-muted-foreground line-clamp-3 text-sm">{post.excerpt}</p>
        <div className="relative z-10">
          <Button
            variant="outline"
            size="sm"
            nativeButton={false}
            render={<Link href={{ pathname: "/blog/[slug]", params: { slug: post.slug } }} />}
          >
            {t("readMore")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
