/// <reference path="../pb_data/types.d.ts" />
migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("user_device_sessions");
    const fieldNames = collection.fields.fieldNames();

    if (fieldNames.includes("browser")) {
      collection.fields.removeByName("browser");
    }

    if (fieldNames.includes("os")) {
      collection.fields.removeByName("os");
    }

    if (fieldNames.includes("user_agent")) {
      collection.fields.removeByName("user_agent");
    }

    return app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("user_device_sessions");
    const fieldNames = collection.fields.fieldNames();

    if (!fieldNames.includes("browser")) {
      collection.fields.addMarshaledJSON(`{
      "autogeneratePattern": "",
      "hidden": false,
      "id": "text3658682170",
      "max": 60,
      "min": 0,
      "name": "browser",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }`);
    }

    if (!fieldNames.includes("os")) {
      collection.fields.addMarshaledJSON(`{
      "autogeneratePattern": "",
      "hidden": false,
      "id": "text1789936913",
      "max": 60,
      "min": 0,
      "name": "os",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }`);
    }

    if (!fieldNames.includes("user_agent")) {
      collection.fields.addMarshaledJSON(`{
      "autogeneratePattern": "",
      "hidden": false,
      "id": "text3293145029",
      "max": 500,
      "min": 0,
      "name": "user_agent",
      "pattern": "",
      "presentable": false,
      "primaryKey": false,
      "required": false,
      "system": false,
      "type": "text"
    }`);
    }

    return app.save(collection);
  }
);
