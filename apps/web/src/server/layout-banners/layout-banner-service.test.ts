import type PocketBase from "pocketbase";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LayoutBannersRecord } from "@/types/pocketbase";
import { getActiveLayoutBanner, getActiveLayoutBannerWithClient } from "./layout-banner-service";

const { cacheLifeMock, cacheTagMock, createPocketBaseClientMock } = vi.hoisted(
  function hoistLayoutBannerServiceMocks() {
    return {
      cacheLifeMock: vi.fn(),
      cacheTagMock: vi.fn(),
      createPocketBaseClientMock: vi.fn(),
    };
  }
);

vi.mock("next/cache", function mockNextCache() {
  return {
    cacheLife: cacheLifeMock,
    cacheTag: cacheTagMock,
  };
});

vi.mock("@/i18n/navigation", function mockNavigation() {
  return {
    getPathname: vi.fn(({ href, locale }: { href: string; locale: string }) => {
      if (href === "/app" && locale === "cs") {
        return "/cs/aplikace";
      }

      return `/${locale}${href}`;
    }),
  };
});

vi.mock("@/server/pocketbase/pocketbase-server", function mockPocketBaseServer() {
  return {
    createPocketBaseClient: createPocketBaseClientMock,
  };
});

describe("layout banner service", function describeLayoutBannerService() {
  beforeEach(function resetMocks() {
    vi.clearAllMocks();
  });

  afterEach(function cleanupGlobals() {
    vi.unstubAllGlobals();
  });

  it("selects the highest priority banner for the requested application area", async function testApplicationBannerSelection() {
    const pb = createPocketBaseMock([
      createLayoutBannerRecord({
        id: "marketing-banner",
        priority: 100,
        show_marketing: true,
        show_application: false,
        title_cs: "Marketing",
      }),
      createLayoutBannerRecord({
        id: "lower-application-banner",
        priority: 5,
        show_application: true,
        title_cs: "Lower priority",
      }),
      createLayoutBannerRecord({
        id: "active-application-banner",
        priority: 10,
        show_application: true,
        title_cs: "Aplikace",
        body_cs: "Dulezite oznameni",
      }),
    ]);

    await expect(
      getActiveLayoutBannerWithClient(pb, {
        area: "application",
        locale: "cs",
      })
    ).resolves.toMatchObject({
      id: "active-application-banner",
      title: "Aplikace",
      body: "Dulezite oznameni",
    });
  });

  it("maps localized content, CTA, severity, dismiss, and background image", async function testBannerMapping() {
    const pb = createPocketBaseMock([
      createLayoutBannerRecord({
        id: "banner-1",
        bg_image: "sale.webp",
        body_en: "Limited offer",
        cta_href: "https://example.com/sale",
        cta_label_en: "Open sale",
        cta_open_new_tab: true,
        remember_dismiss: true,
        severity: "success",
        show_marketing: true,
        title_en: "Sale",
      }),
    ]);

    await expect(
      getActiveLayoutBannerWithClient(pb, {
        area: "marketing",
        locale: "en",
      })
    ).resolves.toEqual({
      id: "banner-1",
      title: "Sale",
      body: "Limited offer",
      severity: "success",
      rememberDismiss: true,
      bgImageUrl: "https://pb.test/files/layout_banners/banner-1/sale.webp",
      cta: {
        label: "Open sale",
        href: "https://example.com/sale",
        openNewTab: true,
      },
    });
  });

  it("skips banners without localized title or body", async function testEmptyLocalizedContent() {
    const pb = createPocketBaseMock([
      createLayoutBannerRecord({
        id: "empty-czech-banner",
        priority: 10,
        show_marketing: true,
        title_en: "English only",
      }),
      createLayoutBannerRecord({
        id: "fallback-banner",
        priority: 1,
        show_marketing: true,
        title_cs: "Cesky obsah",
      }),
    ]);

    await expect(
      getActiveLayoutBannerWithClient(pb, {
        area: "marketing",
        locale: "cs",
      })
    ).resolves.toMatchObject({
      id: "fallback-banner",
      title: "Cesky obsah",
    });
  });

  it("loads public banners through a cached REST request", async function testCachedRestRequest() {
    const fetchMock = vi.fn(async function fetchLayoutBanners(_input: RequestInfo | URL) {
      return Response.json({
        items: [
          createLayoutBannerRecord({
            id: "rest-banner",
            bg_image: "sale image.webp",
            cta_href: "/app?from=banner",
            cta_label_cs: "Otevrit aplikaci",
            show_marketing: true,
            title_cs: "Cached banner",
          }),
        ],
      });
    });

    vi.stubGlobal("fetch", fetchMock);

    await expect(
      getActiveLayoutBanner({
        area: "marketing",
        locale: "cs",
      })
    ).resolves.toMatchObject({
      id: "rest-banner",
      bgImageUrl: expect.stringContaining(
        "/api/files/layout-banners/rest-banner/sale%20image.webp"
      ),
      cta: {
        href: "/cs/aplikace?from=banner",
      },
    });

    const requestUrl = new URL(String(fetchMock.mock.calls[0]?.[0] ?? ""));

    expect(requestUrl.pathname).toBe("/api/collections/layout_banners/records");
    expect(requestUrl.searchParams.get("filter")).toBe("enabled = true && show_marketing = true");
    expect(requestUrl.searchParams.get("sort")).toBe("-priority");
    expect(cacheLifeMock).toHaveBeenCalledWith({
      stale: 30,
      revalidate: 60,
      expire: 3600,
    });
    expect(cacheTagMock).toHaveBeenCalledWith("layout-banners");
  });

  it("fails closed when PocketBase loading fails", async function testPocketBaseFailure() {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

    vi.stubGlobal(
      "fetch",
      vi.fn(async function fetchFailure() {
        return new Response("Unavailable", { status: 503 });
      })
    );

    await expect(
      getActiveLayoutBanner({
        area: "marketing",
        locale: "cs",
      })
    ).resolves.toBeNull();

    consoleErrorSpy.mockRestore();
  });
});

function createPocketBaseMock(records: LayoutBannersRecord[], error?: Error): PocketBase {
  return {
    collection: vi.fn(() => ({
      getFullList: error ? vi.fn().mockRejectedValue(error) : vi.fn().mockResolvedValue(records),
    })),
    files: {
      getURL: vi.fn((record: LayoutBannersRecord, filename: string) => {
        return `https://pb.test/files/${record.collectionName}/${record.id}/${filename}`;
      }),
    },
  } as unknown as PocketBase;
}

function createLayoutBannerRecord(
  overrides: Partial<LayoutBannersRecord> = {}
): LayoutBannersRecord {
  return {
    id: "banner-id",
    collectionId: "layout-banners",
    collectionName: "layout_banners",
    created: "2026-01-01 00:00:00.000Z",
    updated: "2026-01-01 00:00:00.000Z",
    enabled: true,
    show_marketing: false,
    show_application: false,
    remember_dismiss: false,
    priority: 0,
    bg_image: "",
    severity: "info",
    title_cs: "",
    title_en: "",
    body_cs: "",
    body_en: "",
    cta_label_cs: "",
    cta_label_en: "",
    cta_href: "",
    cta_open_new_tab: false,
    ...overrides,
  };
}
