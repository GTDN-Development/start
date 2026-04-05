import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const { cacheLife } = vi.hoisted(function hoistBlogApiMocks() {
  return {
    cacheLife: vi.fn(),
  };
});

vi.mock("next/cache", function mockNextCache() {
  return {
    cacheLife,
  };
});

import { getAllPosts, getPostBySlug } from "./blog-api";

describe("blog api cache profile", function describeBlogApiCacheProfile() {
  beforeEach(function setup() {
    vi.clearAllMocks();
    process.env.NEXT_PUBLIC_PB_URL = "https://example.test";
  });

  afterEach(function cleanup() {
    vi.unstubAllGlobals();
  });

  it("applies the blog cache profile when listing posts", async function testGetAllPostsCacheLife() {
    vi.stubGlobal(
      "fetch",
      vi.fn(async function fetchPosts() {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: "post_1",
                collectionId: "posts",
                created: "2025-01-01T00:00:00.000Z",
                updated: "2025-01-01T00:00:00.000Z",
                title: "Hello world",
                slug: "hello-world",
                excerpt: "Short excerpt",
                content: "<p>Body</p>",
                locale: "en",
                translation_shared_id: "shared_1",
                cover_image: "cover.jpg",
                cover_image_alt: "Cover image",
                published_at: "2025-01-02T00:00:00.000Z",
                status: "published",
              },
            ],
            page: 1,
            perPage: 100,
            totalItems: 1,
            totalPages: 1,
          }),
          { status: 200 }
        );
      })
    );

    const posts = await getAllPosts("en");

    expect(cacheLife).toHaveBeenCalledWith("blog");
    expect(posts).toEqual([
      expect.objectContaining({
        id: "post_1",
        slug: "hello-world",
        title: "Hello world",
        locale: "en",
        coverImage: expect.objectContaining({
          url: expect.stringContaining("/api/files/posts/post_1/cover.jpg"),
          alt: "Cover image",
        }),
      }),
    ]);
  });

  it("applies the blog cache profile when resolving a post by slug", async function testGetPostBySlugCacheLife() {
    vi.stubGlobal(
      "fetch",
      vi.fn(async function fetchPostBySlug() {
        return new Response(
          JSON.stringify({
            items: [
              {
                id: "post_2",
                collectionId: "posts",
                created: "2025-01-01T00:00:00.000Z",
                updated: "2025-01-01T00:00:00.000Z",
                title: "Cached post",
                slug: "cached-post",
                excerpt: "Short excerpt",
                content: "<p>Body</p>",
                locale: "en",
                translation_shared_id: "shared_2",
                cover_image: "",
                cover_image_alt: "",
                published_at: "2025-01-03T00:00:00.000Z",
                status: "published",
              },
            ],
            page: 1,
            perPage: 1,
            totalItems: 1,
            totalPages: 1,
          }),
          { status: 200 }
        );
      })
    );

    const post = await getPostBySlug("cached-post", "en");

    expect(cacheLife).toHaveBeenCalledWith("blog");
    expect(post).toEqual(
      expect.objectContaining({
        id: "post_2",
        slug: "cached-post",
        coverImage: null,
      })
    );
  });
});
