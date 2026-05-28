/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    if (findLayoutBannersCollection(app)) {
      return null;
    }

    const collection = new Collection({
      createRule: null,
      deleteRule: null,
      fields: [
        {
          name: "enabled",
          type: "bool",
        },
        {
          name: "show_marketing",
          type: "bool",
        },
        {
          name: "show_application",
          type: "bool",
        },
        {
          name: "remember_dismiss",
          type: "bool",
        },
        {
          name: "priority",
          onlyInt: true,
          type: "number",
        },
        {
          maxSelect: 1,
          maxSize: 5242880,
          mimeTypes: ["image/jpeg", "image/png", "image/webp"],
          name: "bg_image",
          type: "file",
        },
        {
          maxSelect: 1,
          name: "severity",
          required: true,
          type: "select",
          values: ["info", "warning", "success"],
        },
        {
          max: 200,
          name: "title_cs",
          type: "text",
        },
        {
          max: 200,
          name: "title_en",
          type: "text",
        },
        {
          name: "body_cs",
          type: "text",
        },
        {
          name: "body_en",
          type: "text",
        },
        {
          max: 80,
          name: "cta_label_cs",
          type: "text",
        },
        {
          max: 80,
          name: "cta_label_en",
          type: "text",
        },
        {
          max: 2048,
          name: "cta_href",
          type: "text",
        },
        {
          name: "cta_open_new_tab",
          type: "bool",
        },
      ],
      indexes: [
        "CREATE INDEX `idx_layout_banners_marketing` ON `layout_banners` (`enabled`, `show_marketing`, `priority`)",
        "CREATE INDEX `idx_layout_banners_application` ON `layout_banners` (`enabled`, `show_application`, `priority`)",
      ],
      listRule: "enabled = true",
      name: "layout_banners",
      system: false,
      type: "base",
      updateRule: null,
      viewRule: "enabled = true",
    });

    return app.save(collection);
  },
  (app) => {
    const collection = findLayoutBannersCollection(app);

    if (!collection) {
      return null;
    }

    return app.delete(collection);
  }
);

function findLayoutBannersCollection(app) {
  try {
    return app.findCollectionByNameOrId("layout_banners");
  } catch (_) {
    return null;
  }
}
