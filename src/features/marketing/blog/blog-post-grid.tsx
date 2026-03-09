"use client";

import { useState } from "react";
import { BlogPostCard } from "@/features/marketing/blog/blog-post-card";
import { Button } from "@/components/ui/button";
import type { BlogPost } from "@/server/blog/blog-api";

const POSTS_PER_PAGE = 6;

type BlogPostGridProps = {
  posts: BlogPost[];
  loadMoreLabel: string;
  readMoreLabel: string;
};

export function BlogPostGrid({ posts, loadMoreLabel, readMoreLabel }: BlogPostGridProps) {
  const [visibleCount, setVisibleCount] = useState(POSTS_PER_PAGE);

  const visiblePosts = posts.slice(0, visibleCount);
  const hasMore = visibleCount < posts.length;

  function handleLoadMore() {
    setVisibleCount((prev) => prev + POSTS_PER_PAGE);
  }

  return (
    <div className="space-y-10">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {visiblePosts.map((post) => (
          <div key={post.id} className="relative">
            <BlogPostCard post={post} readMoreLabel={readMoreLabel} />
          </div>
        ))}
      </div>
      {hasMore && (
        <div className="flex justify-center">
          <Button variant="outline" onClick={handleLoadMore}>
            {loadMoreLabel}
          </Button>
        </div>
      )}
    </div>
  );
}
