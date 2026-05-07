/// <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const users = app.findRecordsByFilter(
      "users",
      "emailVisibility = false || emailVisibility = null",
      "",
      0,
      0
    );

    for (const user of users) {
      user.set("emailVisibility", true);
      app.save(user);
    }
  },
  (app) => {
    return null;
  }
);
