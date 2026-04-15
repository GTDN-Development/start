/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const userDeviceSessions = app.findCollectionByNameOrId("user_device_sessions");
    const ownDeviceSessionRule = ['@request.auth.id != ""', "user = @request.auth.id"].join(" && ");
    const updateOwnDeviceSessionRule = [
      '@request.auth.id != ""',
      "user = @request.auth.id",
      "(@request.body.user:isset = false || @request.body.user = @request.auth.id)",
    ].join(" && ");

    userDeviceSessions.createRule =
      '@request.auth.id != "" && @request.body.user = @request.auth.id';
    userDeviceSessions.listRule = ownDeviceSessionRule;
    userDeviceSessions.viewRule = ownDeviceSessionRule;
    userDeviceSessions.updateRule = updateOwnDeviceSessionRule;
    userDeviceSessions.deleteRule = ownDeviceSessionRule;

    return app.save(userDeviceSessions);
  },
  (app) => {
    const userDeviceSessions = app.findCollectionByNameOrId("user_device_sessions");

    userDeviceSessions.createRule = "";
    userDeviceSessions.listRule = "";
    userDeviceSessions.viewRule = "";
    userDeviceSessions.updateRule = "";
    userDeviceSessions.deleteRule = "";

    return app.save(userDeviceSessions);
  }
);
