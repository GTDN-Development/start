/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const collection = findNewsletterSubscriptionsCollection(app);

    if (!collection) {
      return null;
    }

    return app.delete(collection);
  },
  (app) => {
    if (findNewsletterSubscriptionsCollection(app)) {
      return null;
    }

    const collection = new Collection({
      createRule: "",
      deleteRule: null,
      fields: [
        {
          autogeneratePattern: "[a-z0-9]{15}",
          hidden: false,
          id: "text3208210256",
          max: 15,
          min: 15,
          name: "id",
          pattern: "^[a-z0-9]+$",
          presentable: false,
          primaryKey: true,
          required: true,
          system: true,
          type: "text",
        },
        {
          autogeneratePattern: "",
          hidden: false,
          id: "text1198071845",
          max: 254,
          min: 1,
          name: "email",
          pattern: "",
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: "text",
        },
        {
          hidden: false,
          id: "select1796014025",
          maxSelect: 1,
          name: "locale",
          presentable: false,
          required: true,
          system: false,
          type: "select",
          values: ["cs", "en"],
        },
        {
          autogeneratePattern: "",
          hidden: false,
          id: "text2579369476",
          max: 64,
          min: 1,
          name: "source",
          pattern: "",
          presentable: false,
          primaryKey: false,
          required: true,
          system: false,
          type: "text",
        },
        {
          hidden: false,
          id: "autodate2990389176",
          name: "created",
          onCreate: true,
          onUpdate: false,
          presentable: false,
          system: false,
          type: "autodate",
        },
        {
          hidden: false,
          id: "autodate3332085495",
          name: "updated",
          onCreate: true,
          onUpdate: true,
          presentable: false,
          system: false,
          type: "autodate",
        },
      ],
      id: "pbc_3424179071",
      indexes: [
        "CREATE UNIQUE INDEX `idx_newsletter_subscriptions_email` ON `newsletter_subscriptions` (`email`)",
      ],
      listRule: null,
      name: "newsletter_subscriptions",
      system: false,
      type: "base",
      updateRule: null,
      viewRule: null,
    });

    return app.save(collection);
  }
);

function findNewsletterSubscriptionsCollection(app) {
  try {
    return app.findCollectionByNameOrId("newsletter_subscriptions");
  } catch (_) {
    return null;
  }
}
