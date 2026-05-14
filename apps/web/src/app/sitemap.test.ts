import { beforeEach, describe, expect, it, vi } from "vitest";

const { connection, getAllPosts } = vi.hoisted(function hoistSitemapMocks() {
  return {
    connection: vi.fn(),
    getAllPosts: vi.fn(),
  };
});

vi.mock("next/server", function mockNextServer() {
  return {
    connection,
  };
});

vi.mock("@/server/blog/blog-api", function mockBlogApi() {
  return {
    getAllPosts,
  };
});

vi.mock("@/i18n/navigation", function mockI18nNavigation() {
  return {
    getPathname: vi.fn(function getPathname({
      href,
      locale,
    }: {
      href: string | { pathname: string; params?: Record<string, string> };
      locale: string;
    }) {
      if (typeof href === "string") {
        return `/${locale}${href === "/" ? "" : href}`;
      }

      const slug = href.params?.slug;

      if (href.pathname === "/blog/[slug]" && slug) {
        return `/${locale}/blog/${slug}`;
      }

      return `/${locale}${href.pathname}`;
    }),
  };
});

import sitemap from "./sitemap";

describe("sitemap", function describeSitemap() {
  beforeEach(function setup() {
    vi.clearAllMocks();
    getAllPosts
      .mockResolvedValueOnce([
        {
          id: "post_cs",
          date: "2025-01-01T00:00:00.000Z",
          slug: "ahoj",
          title: "Ahoj",
          content: "",
          excerpt: "",
          locale: "cs",
          translationSharedId: "shared_cs",
          coverImage: null,
        },
      ])
      .mockResolvedValueOnce([
        {
          id: "post_en",
          date: "2025-01-02T00:00:00.000Z",
          slug: "hello",
          title: "Hello",
          content: "",
          excerpt: "",
          locale: "en",
          translationSharedId: "shared_en",
          coverImage: null,
        },
      ]);
  });

  it("defers to request time and includes localized blog entries", async function testSitemap() {
    const entries = await sitemap();

    expect(connection).toHaveBeenCalledOnce();
    expect(getAllPosts).toHaveBeenNthCalledWith(1, "cs");
    expect(getAllPosts).toHaveBeenNthCalledWith(2, "en");
    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          url: expect.stringContaining("/cs/blog/ahoj"),
        }),
        expect.objectContaining({
          url: expect.stringContaining("/en/blog/hello"),
        }),
      ])
    );
  });
});
