/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("user_device_sessions");
    const fieldNames = collection.fields.fieldNames();

    collection.removeIndex("idx_user_device_sessions_user_active_last_seen");
    collection.removeIndex("idx_user_device_sessions_user_revoked_at");

    if (fieldNames.includes("ip_masked")) {
      collection.fields.removeByName("ip_masked");
    }

    if (fieldNames.includes("ip_hash")) {
      collection.fields.removeByName("ip_hash");
    }

    if (fieldNames.includes("location_label")) {
      collection.fields.removeByName("location_label");
    }

    if (fieldNames.includes("revoked_at")) {
      collection.fields.removeByName("revoked_at");
    }

    if (fieldNames.includes("revoked_reason")) {
      collection.fields.removeByName("revoked_reason");
    }

    if (fieldNames.includes("remember_me")) {
      collection.fields.removeByName("remember_me");
    }

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("user_device_sessions");
    const fieldNames = collection.fields.fieldNames();

    if (!fieldNames.includes("ip_masked")) {
      collection.fields.addMarshaledJSON(`{
      "autogeneratePattern": "",
      "hidden": false,
      "id": "text274823414",
      "max": 64,
      "min": 0,
      "name": "ip_masked",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }`);
    }

    if (!fieldNames.includes("ip_hash")) {
      collection.fields.addMarshaledJSON(`{
      "autogeneratePattern": "",
      "hidden": false,
      "id": "text3269410359",
      "max": 64,
      "min": 0,
      "name": "ip_hash",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }`);
    }

    if (!fieldNames.includes("location_label")) {
      collection.fields.addMarshaledJSON(`{
      "autogeneratePattern": "",
      "hidden": false,
      "id": "text2029721037",
      "max": 120,
      "min": 0,
      "name": "location_label",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }`);
    }

    if (!fieldNames.includes("revoked_at")) {
      collection.fields.addMarshaledJSON(`{
      "hidden": false,
      "id": "date3687365789",
      "max": "",
      "min": "",
      "name": "revoked_at",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "date"
    }`);
    }

    if (!fieldNames.includes("revoked_reason")) {
      collection.fields.addMarshaledJSON(`{
      "hidden": false,
      "id": "select4119331924",
      "maxSelect": 1,
      "name": "revoked_reason",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "select",
      "values": [
        "signed_out",
        "signed_out_others",
        "capped",
        "expired",
        "admin"
      ]
    }`);
    }

    if (!fieldNames.includes("remember_me")) {
      collection.fields.addMarshaledJSON(`{
      "hidden": false,
      "id": "bool2062722856",
      "name": "remember_me",
      "presentable": false,
      "required": false,
      "system": false,
      "type": "bool"
    }`);
    }

    collection.addIndex(
      "idx_user_device_sessions_user_active_last_seen",
      false,
      '"user", revoked_at, last_seen_at',
      ""
    );
    collection.addIndex(
      "idx_user_device_sessions_user_revoked_at",
      false,
      '"user", revoked_at',
      ""
    );

    return app.save(collection);
  }
);
