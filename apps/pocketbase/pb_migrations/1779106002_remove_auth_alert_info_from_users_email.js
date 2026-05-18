/// <reference path="../pb_data/types.d.ts" />

const AUTH_ALERT_INFO_BLOCK = `
      <div style="margin:24px 0;padding:16px 18px;border:1px solid #e5e7eb;border-radius:12px;background-color:#f9fafb;font-size:20px;line-height:28px;font-weight:700;color:#111827;">
        {ALERT_INFO}
      </div>`;

const AUTH_ALERT_INTRO_PARAGRAPH = `
      <p style="margin:0 0 16px;font-size:16px;line-height:26px;color:#111827;">
        Zaznamenali jsme přihlášení k vašemu účtu {APP_NAME} z nového místa.
      </p>`;

migrate(
  (app) => {
    const collection = app.findCollectionByNameOrId("users");

    collection.authAlert.emailTemplate.body = collection.authAlert.emailTemplate.body.replace(
      AUTH_ALERT_INFO_BLOCK,
      ""
    );

    app.save(collection);
  },
  (app) => {
    const collection = app.findCollectionByNameOrId("users");

    if (!collection.authAlert.emailTemplate.body.includes("{ALERT_INFO}")) {
      collection.authAlert.emailTemplate.body = collection.authAlert.emailTemplate.body.replace(
        AUTH_ALERT_INTRO_PARAGRAPH,
        AUTH_ALERT_INTRO_PARAGRAPH + "\n" + AUTH_ALERT_INFO_BLOCK
      );
    }

    app.save(collection);
  }
);
