import type PocketBase from "pocketbase";
import type { Locale } from "next-intl";
import { cacheLife, cacheTag } from "next/cache";
import type {
  LayoutBannerSeverity,
  LayoutBannerViewModel,
} from "@/components/layout/layout-banners";
import { getPocketBaseUrl } from "@/config/public-env";
import { getPathname, type AppPathname } from "@/i18n/navigation";
import { getNullableTrimmedString, logServiceError } from "@/server/pocketbase/pocketbase-utils";
import type { LayoutBannersRecord } from "@/types/pocketbase";

export type LayoutBannerArea = "marketing" | "application";

type GetActiveLayoutBannerInput = {
  area: LayoutBannerArea;
  locale: Locale;
};

type PocketBaseListResponse<T> = {
  items: T[];
};

type LayoutBannerLocale = "cs" | "en";
type LayoutBannerFileUrlResolver = (record: LayoutBannersRecord, filename: string) => string;

const layoutBannerSeverities = ["info", "warning", "success"] as const;
const staticLayoutBannerHrefs = [
  "/",
  "/about/changelog",
  "/about/features",
  "/about/integrations",
  "/about/roadmap",
  "/app",
  "/blog",
  "/contact",
  "/contact/sales",
  "/contact/support",
  "/pricing",
] as const satisfies readonly AppPathname[];

export async function getActiveLayoutBanner(
  input: GetActiveLayoutBannerInput
): Promise<LayoutBannerViewModel | null> {
  return getCachedActiveLayoutBanner(input);
}

async function getCachedActiveLayoutBanner(
  input: GetActiveLayoutBannerInput
): Promise<LayoutBannerViewModel | null> {
  "use cache";
  cacheLife({
    stale: 30,
    revalidate: 60,
    expire: 3600,
  });
  cacheTag("layout-banners");

  try {
    const records = await fetchLayoutBannerRecords(input.area);

    return selectActiveLayoutBanner(records, input, getLayoutBannerFileUrl);
  } catch (error) {
    logServiceError("layout-banners", "Failed to load active layout banner", error);

    return null;
  }
}

export async function getActiveLayoutBannerWithClient(
  pb: PocketBase,
  input: GetActiveLayoutBannerInput
): Promise<LayoutBannerViewModel | null> {
  const areaField = getAreaField(input.area);
  const records = await pb.collection("layout_banners").getFullList<LayoutBannersRecord>({
    filter: `enabled = true && ${areaField} = true`,
  });

  return selectActiveLayoutBanner(records, input, function resolveFileUrl(record, filename) {
    return pb.files.getURL(record, filename);
  });
}

async function fetchLayoutBannerRecords(area: LayoutBannerArea): Promise<LayoutBannersRecord[]> {
  const areaField = getAreaField(area);
  const params = new URLSearchParams({
    filter: `enabled = true && ${areaField} = true`,
    perPage: "50",
    skipTotal: "true",
    sort: "-priority",
  });
  const response = await fetch(
    `${getPocketBaseUrl()}/api/collections/layout_banners/records?${params}`
  );

  if (!response.ok) {
    throw new Error(`PocketBase layout banners request failed with status ${response.status}.`);
  }

  const data: PocketBaseListResponse<LayoutBannersRecord> = await response.json();

  return Array.isArray(data.items) ? data.items : [];
}

function selectActiveLayoutBanner(
  records: LayoutBannersRecord[],
  input: GetActiveLayoutBannerInput,
  getFileUrl: LayoutBannerFileUrlResolver
): LayoutBannerViewModel | null {
  const locale = normalizeLayoutBannerLocale(input.locale);

  return (
    records
      .filter((record) => isRecordEnabledForArea(record, input.area))
      .sort(compareLayoutBannerRecords)
      .map((record) => mapLayoutBannerRecord(record, locale, getFileUrl))
      .find((banner): banner is LayoutBannerViewModel => banner !== null) ?? null
  );
}

function mapLayoutBannerRecord(
  record: LayoutBannersRecord,
  locale: LayoutBannerLocale,
  getFileUrl: LayoutBannerFileUrlResolver
): LayoutBannerViewModel | null {
  const title = getLocalizedText(record, locale, "title");
  const body = getLocalizedText(record, locale, "body");

  if (!title && !body) {
    return null;
  }

  const ctaLabel = getLocalizedText(record, locale, "cta_label");
  const ctaHref = getNullableTrimmedString(record.cta_href);
  const cta =
    ctaLabel && ctaHref
      ? {
          label: ctaLabel,
          href: localizeLayoutBannerHref(ctaHref, locale),
          openNewTab: record.cta_open_new_tab === true,
        }
      : null;

  return {
    id: record.id,
    title,
    body,
    severity: normalizeLayoutBannerSeverity(record.severity),
    rememberDismiss: record.remember_dismiss === true,
    bgImageUrl: record.bg_image ? getFileUrl(record, record.bg_image) : null,
    cta,
  };
}

function getLayoutBannerFileUrl(record: LayoutBannersRecord, filename: string): string {
  return `${getPocketBaseUrl()}/api/files/${record.collectionId}/${record.id}/${encodeURIComponent(filename)}`;
}

function getLocalizedText(
  record: LayoutBannersRecord,
  locale: LayoutBannerLocale,
  field: "title" | "body" | "cta_label"
): string | null {
  return getNullableTrimmedString(record[`${field}_${locale}`]);
}

function isRecordEnabledForArea(record: LayoutBannersRecord, area: LayoutBannerArea): boolean {
  if (record.enabled !== true) {
    return false;
  }

  if (area === "marketing") {
    return record.show_marketing === true;
  }

  return record.show_application === true;
}

function compareLayoutBannerRecords(left: LayoutBannersRecord, right: LayoutBannersRecord): number {
  const priorityDifference = getPriority(right) - getPriority(left);

  if (priorityDifference !== 0) {
    return priorityDifference;
  }

  return right.created.localeCompare(left.created);
}

function getPriority(record: LayoutBannersRecord): number {
  return typeof record.priority === "number" && Number.isFinite(record.priority)
    ? record.priority
    : 0;
}

function getAreaField(area: LayoutBannerArea): "show_marketing" | "show_application" {
  return area === "marketing" ? "show_marketing" : "show_application";
}

function normalizeLayoutBannerLocale(locale: Locale): LayoutBannerLocale {
  return locale === "en" ? "en" : "cs";
}

function normalizeLayoutBannerSeverity(value: string): LayoutBannerSeverity {
  return layoutBannerSeverities.find((severity) => severity === value) ?? "info";
}

function localizeLayoutBannerHref(href: string, locale: LayoutBannerLocale): string {
  if (!isRootRelativeHref(href)) {
    return href;
  }

  const [, pathname = href, suffix = ""] = /^([^?#]*)([?#].*)?$/.exec(href) ?? [];

  if (!isStaticLayoutBannerHref(pathname)) {
    return href;
  }

  return `${getPathname({ href: pathname, locale })}${suffix}`;
}

function isRootRelativeHref(value: string): value is `/${string}` {
  return value.startsWith("/") && !value.startsWith("//");
}

function isStaticLayoutBannerHref(
  value: string
): value is (typeof staticLayoutBannerHrefs)[number] {
  return staticLayoutBannerHrefs.some((href) => href === value);
}
