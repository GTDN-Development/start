import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import {
  LayoutBanners,
  LAYOUT_BANNER_DISMISSED_IDS_STORAGE_KEY,
  type LayoutBannerViewModel,
} from "./layout-banners";

const DISMISSED_IDS_COOKIE_NAME = "layout_banner_dismissed_ids";

describe("LayoutBanners", function describeLayoutBanners() {
  beforeEach(function resetDismissedBannerState() {
    window.localStorage.clear();
    document.cookie = `${DISMISSED_IDS_COOKIE_NAME}=; Path=/; Max-Age=0`;
  });

  it("allows temporary dismiss when remember dismiss is disabled", function testTemporaryDismiss() {
    render(
      <LayoutBanners
        banner={createLayoutBanner({ rememberDismiss: false })}
        labels={{ dismiss: "Close banner" }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Close banner" }));

    expect(screen.queryByTestId("layout-banner")).toBeNull();
    expect(window.localStorage.getItem(LAYOUT_BANNER_DISMISSED_IDS_STORAGE_KEY)).toBeNull();
  });

  it("persists dismiss when remember dismiss is enabled", function testPersistentDismiss() {
    render(
      <LayoutBanners
        banner={createLayoutBanner({ id: "persistent-banner", rememberDismiss: true })}
        labels={{ dismiss: "Close banner" }}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Close banner" }));

    expect(screen.queryByTestId("layout-banner")).toBeNull();
    expect(
      JSON.parse(window.localStorage.getItem(LAYOUT_BANNER_DISMISSED_IDS_STORAGE_KEY) ?? "[]")
    ).toContain("persistent-banner");
  });
});

function createLayoutBanner(
  overrides: Partial<LayoutBannerViewModel> = {}
): LayoutBannerViewModel {
  return {
    id: "layout-banner",
    title: "System notice",
    body: "Maintenance window starts soon.",
    severity: "info",
    rememberDismiss: false,
    bgImageUrl: null,
    cta: null,
    ...overrides,
  };
}
