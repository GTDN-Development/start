routerAdd("POST", "/api/start/contact-requests/email", function sendContactRequestEmail(e) {
  var startEmail = require(`${__hooks}/lib/start-email.js`);
  const requestInfo = e.requestInfo();
  const body = requestInfo.body || {};

  startEmail.requireInternalRequest(e);

  const fullName = startEmail.normalizeRequiredString(body.fullName, 200);
  const email = startEmail.normalizeEmail(body.email);
  const phone = startEmail.normalizeRequiredString(body.phone, 80);
  const message = startEmail.normalizeRequiredString(body.message, 5000);

  if (!fullName || !email || !phone || !message) {
    throw new BadRequestError("Missing or invalid contact request.");
  }

  startEmail.sendAppEmail(
    e.app,
    startEmail.createContactRequestEmail({
      fullName,
      email,
      phone,
      message,
      submittedAt: new Date(),
    })
  );

  return e.json(200, {
    ok: true,
  });
});

routerAdd("POST", "/api/start/support-requests/email", function sendSupportRequestEmail(e) {
  var startEmail = require(`${__hooks}/lib/start-email.js`);
  const requestInfo = e.requestInfo();
  const auth = startEmail.requireUsersAuth(requestInfo);
  const body = requestInfo.body || {};
  const message = startEmail.normalizeRequiredString(body.message, 1000);

  startEmail.requireInternalRequest(e);

  if (!message || message.length < 10) {
    throw new BadRequestError("Missing or invalid support request.");
  }

  const attachments = startEmail.createAttachments(body.attachments);

  startEmail.sendAppEmail(
    e.app,
    startEmail.createSupportRequestEmail({
      email: auth.getString("email"),
      message,
      submittedAt: new Date(),
      attachments,
    })
  );

  return e.json(200, {
    ok: true,
  });
});

routerAdd("POST", "/api/start/newsletter-signups", function createNewsletterSignup(e) {
  var startEmail = require(`${__hooks}/lib/start-email.js`);
  const requestInfo = e.requestInfo();
  const body = requestInfo.body || {};

  startEmail.requireInternalRequest(e);

  const email = startEmail.normalizeEmail(body.email);

  if (!email) {
    throw new BadRequestError("Missing or invalid newsletter signup.");
  }

  let status = "created";

  try {
    const collection = e.app.findCollectionByNameOrId("newsletter_subscriptions");
    const record = new Record(collection, {
      email,
      locale: "cs",
      source: "marketing_newsletter_form",
    });

    e.app.save(record);
  } catch (error) {
    const existingSubscription = findNewsletterSubscription(e.app, email);

    if (!existingSubscription) {
      throw error;
    }

    status = "duplicate";
  }

  if (status === "created") {
    try {
      startEmail.sendAppEmail(
        e.app,
        startEmail.createNewsletterSignupEmail({
          email,
          subscribedAt: new Date(),
        })
      );
    } catch (error) {
      console.error("newsletter signup notification failed:", error);
    }
  }

  return e.json(200, {
    ok: true,
    status,
  });

  function findNewsletterSubscription(app, emailNormalized) {
    try {
      return app.findFirstRecordByData("newsletter_subscriptions", "email", emailNormalized);
    } catch (_) {
      return null;
    }
  }
});
