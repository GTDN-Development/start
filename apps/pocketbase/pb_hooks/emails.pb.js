routerAdd("POST", "/api/web/contact-requests/email", function sendContactRequestEmail(e) {
  var appEmail = require(`${__hooks}/lib/app-email.js`);
  const requestInfo = e.requestInfo();
  const body = requestInfo.body || {};

  appEmail.requireInternalRequest(e);

  const fullName = appEmail.normalizeRequiredString(body.fullName, 200);
  const email = appEmail.normalizeEmail(body.email);
  const phone = appEmail.normalizeRequiredString(body.phone, 80);
  const message = appEmail.normalizeRequiredString(body.message, 5000);

  if (!fullName || !email || !phone || !message) {
    throw new BadRequestError("Missing or invalid contact request.");
  }

  appEmail.sendAppEmail(
    e.app,
    appEmail.createContactRequestEmail({
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

routerAdd("POST", "/api/web/support-requests/email", function sendSupportRequestEmail(e) {
  var appEmail = require(`${__hooks}/lib/app-email.js`);
  const requestInfo = e.requestInfo();
  const auth = appEmail.requireUsersAuth(requestInfo);
  const body = requestInfo.body || {};
  const message = appEmail.normalizeRequiredString(body.message, 1000);

  appEmail.requireInternalRequest(e);

  if (!message || message.length < 10) {
    throw new BadRequestError("Missing or invalid support request.");
  }

  const attachments = appEmail.createAttachments(body.attachments);

  appEmail.sendAppEmail(
    e.app,
    appEmail.createSupportRequestEmail({
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
