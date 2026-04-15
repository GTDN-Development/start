/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const userDeviceSessions = app.findCollectionByNameOrId("user_device_sessions");
    const userField = userDeviceSessions.fields.getByName("user");

    userField.cascadeDelete = true;

    return app.save(userDeviceSessions);
  },
  (app) => {
    const userDeviceSessions = app.findCollectionByNameOrId("user_device_sessions");
    const userField = userDeviceSessions.fields.getByName("user");

    userField.cascadeDelete = false;

    return app.save(userDeviceSessions);
  }
);
