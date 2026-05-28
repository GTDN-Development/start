/// <reference path="../pb_data/types.d.ts" />

const SEED_ENV = "PB_SEED_LAYOUT_BANNER_DEMO";
const DEMO_TITLE_EN = "Local layout banner demo";

migrate(
  (app) => {
    if (!isEnabledEnv(SEED_ENV)) {
      return null;
    }

    const collection = findLayoutBannersCollection(app);

    if (!collection || findDemoLayoutBanner(app)) {
      return null;
    }

    const record = new Record(collection, {
      enabled: true,
      show_marketing: true,
      show_application: true,
      remember_dismiss: true,
      priority: 100,
      severity: "warning",
      title_cs: "Lokální testovací banner",
      title_en: DEMO_TITLE_EN,
      body_cs: "Tento banner je jen pro lokální kontrolu marketingu i aplikace.",
      body_en: "This banner is only for local testing across marketing and application layouts.",
      cta_label_cs: "Otevřít aplikaci",
      cta_label_en: "Open app",
      cta_href: "/app",
      cta_open_new_tab: false,
    });

    return app.save(record);
  },
  (app) => {
    if (!isEnabledEnv(SEED_ENV)) {
      return null;
    }

    const record = findDemoLayoutBanner(app);

    if (!record) {
      return null;
    }

    return app.delete(record);
  }
);

function isEnabledEnv(name) {
  const value = String($os.getenv(name) || "")
    .trim()
    .toLowerCase();

  return value === "1" || value === "true" || value === "yes" || value === "on";
}

function findLayoutBannersCollection(app) {
  try {
    return app.findCollectionByNameOrId("layout_banners");
  } catch (_) {
    return null;
  }
}

function findDemoLayoutBanner(app) {
  const collection = findLayoutBannersCollection(app);

  if (!collection) {
    return null;
  }

  const records = app.findRecordsByFilter(
    "layout_banners",
    `title_en = "${DEMO_TITLE_EN}"`,
    "",
    1,
    0
  );

  return records.length > 0 ? records[0] : null;
}
