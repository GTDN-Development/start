"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { BlogPostCard } from "@/features/marketing/blog/blog-post-card";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/server/blog/blog-api";
import { cn } from "@/lib/utils";

const POSTS_PER_PAGE = 6;

type BlogPostGridProps = React.ComponentProps<"div"> & {
  posts: BlogPost[];
};

export function BlogPostGrid({ posts, className, ...props }: BlogPostGridProps) {
  const t = useTranslations("pages.blog");
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  function handleLoadMore() {
    setVisibleCount((prev) => prev + POSTS_PER_PAGE);
  }

  return (
    <div className={cn("space-y-10", className)} {...props}>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePosts.map((post) => (
          <div key={post.id} className="relative">
            <BlogPostCard post={post} />
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore}>
            {t("loadMore")}
          </Button>
        </div>
      )}
    </div>
  );
}
