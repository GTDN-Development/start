import type PocketBase from "pocketbase";
import type { Locale } from "next-intl";
import type {
  LayoutBannerSeverity,
  LayoutBannerViewModel,
} from "@/components/layout/layout-banners";
import { createPocketBaseClient } from "@/server/pocketbase/pocketbase-server";
import { getNullableTrimmedString, logServiceError } from "@/server/pocketbase/pocketbase-utils";
import type { LayoutBannersRecord } from "@/types/pocketbase";

export type LayoutBannerArea = "marketing" | "application";

type GetActiveLayoutBannerInput = {
  area: LayoutBannerArea;
  locale: Locale;
};

type LayoutBannerLocale = "cs" | "en";

const layoutBannerSeverities = ["info", "warning", "success"] as const;

export async function getActiveLayoutBanner(
  input: GetActiveLayoutBannerInput
): Promise<LayoutBannerViewModel | null> {
  try {
    const pb = createPocketBaseClient();

    return await getActiveLayoutBannerWithClient(pb, input);
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
  const locale = normalizeLayoutBannerLocale(input.locale);

  return (
    records
      .filter((record) => isRecordEnabledForArea(record, input.area))
      .sort(compareLayoutBannerRecords)
      .map((record) => mapLayoutBannerRecord(pb, record, locale))
      .find((banner): banner is LayoutBannerViewModel => banner !== null) ?? null
  );
}

function mapLayoutBannerRecord(
  pb: PocketBase,
  record: LayoutBannersRecord,
  locale: LayoutBannerLocale
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
          href: ctaHref,
          openNewTab: record.cta_open_new_tab === true,
        }
      : null;

  return {
    id: record.id,
    title,
    body,
    severity: normalizeLayoutBannerSeverity(record.severity),
    rememberDismiss: record.remember_dismiss === true,
    bgImageUrl: record.bg_image ? pb.files.getURL(record, record.bg_image) : null,
    cta,
  };
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
