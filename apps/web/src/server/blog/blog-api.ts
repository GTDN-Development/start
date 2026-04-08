import { cacheLife } from "next/cache";
import { getPocketBaseUrl } from "@/config/public-env";
import type { PostsRecord } from "@/types/pocketbase";

export type BlogPost = {
  id: string;
  date: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  locale: "cs" | "en" | null;
  translationSharedId: string | null;
  coverImage: {
    url: string;
    alt: string;
  } | null;
};

type PBListResponse<T> = {
  items: T[];
  page: number;
  perPage: number;
  totalItems: number;
  totalPages: number;
};

function getFileUrl(collectionId: string, recordId: string, filename: string): string {
  return `${getPocketBaseUrl()}/api/files/${collectionId}/${recordId}/${filename}`;
}

function embedYouTubeLinks(html: string): string {
  return html.replace(
    /(?:<a[^>]*>)?\s*https?:\/\/(?:www\.)?youtube\.com\/watch\?v=([\w-]+)[^\s<]*\s*(?:<\/a>)?/g,
    '<iframe src="https://www.youtube.com/embed/$1" frameborder="0" allowfullscreen></iframe>'
  );
}

function escapePBValue(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

function mapPost(record: PostsRecord): BlogPost {
  return {
    id: record.id,
    date: record.published_at || record.created,
    slug: record.slug,
    title: record.title,
    content: record.content ? embedYouTubeLinks(record.content) : "",
    excerpt: record.excerpt,
    locale: record.locale ?? null,
    translationSharedId: record.translation_shared_id ?? null,
    coverImage: record.cover_image
      ? {
          url: getFileUrl(record.collectionId, record.id, record.cover_image),
          alt: record.cover_image_alt || record.title,
        }
      : null,
  };
}

async function fetchPosts(params: Record<string, string>): Promise<PostsRecord[]> {
  const searchParams = new URLSearchParams({ ...params, skipTotal: "true" });

  const response = await fetch(
    `${getPocketBaseUrl()}/api/collections/posts/records?${searchParams}`
  );

  if (!response.ok) {
    return [];
  }

  const data: PBListResponse<PostsRecord> = await response.json();

  return data.items;
}

export async function getAllPosts(locale: "cs" | "en"): Promise<BlogPost[]> {
  "use cache";
  cacheLife("blog");

  try {
    const items = await fetchPosts({
      sort: "-published_at",
      filter: `status="published" && locale="${locale}"`,
      perPage: "100",
      fields:
        "id,collectionId,title,slug,excerpt,published_at,created,cover_image,cover_image_alt,locale,translation_shared_id",
    });

    return items.map(mapPost);
  } catch {
    return [];
  }
}

export async function getPostBySlug(slug: string, locale: "cs" | "en"): Promise<BlogPost | null> {
  "use cache";
  cacheLife("blog");

  try {
    const items = await fetchPosts({
      filter: `slug="${escapePBValue(slug)}" && status="published" && locale="${locale}"`,
      perPage: "1",
    });

    const record = items[0];

    if (!record) {
      return null;
    }

    return mapPost(record);
  } catch {
    return null;
  }
}

export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, "").trim();
}
