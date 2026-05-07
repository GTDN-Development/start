// / <reference path="../pb_data/types.d.ts" />

migrate(
  (app) => {
    const usersCollection = app.findCollectionByNameOrId("users");

    usersCollection.verificationTemplate.body = buildVerificationTemplate();
    usersCollection.resetPasswordTemplate.body = buildResetPasswordTemplate();
    usersCollection.confirmEmailChangeTemplate.body = buildConfirmEmailChangeTemplate();
    usersCollection.otp.emailTemplate.body = buildOtpTemplate();
    usersCollection.authAlert.emailTemplate.body = buildAuthAlertTemplate();

    return app.save(usersCollection);
  },
  (app) => {
    const usersCollection = app.findCollectionByNameOrId("users");

    usersCollection.verificationTemplate.body =
      '<p>Dobrý den,</p>\n<p>Kliknutím na tlačítko níže ověříte svou e-mailovou adresu.</p>\n<p>\n<a class="btn" href="{APP_URL}/api/pocketbase/email-link?action=verify-email&token={TOKEN}" target="_blank" rel="noopener">Ověřit e-mail</a>\n</p>\n<p><i>Pokud jste o ověření e-mailové adresy nežádali, můžete tento e-mail ignorovat.</i></p>\n<p>\n  S pozdravem,<br/>\n  Tým {APP_NAME}\n</p>\n';

    usersCollection.resetPasswordTemplate.body =
      '<p>Dobrý den,</p>\n<p>Kliknutím na tlačítko níže obnovíte své heslo.</p>\n<p>\n<a class="btn" href="{APP_URL}/api/pocketbase/email-link?action=reset-password&token={TOKEN}" target="_blank" rel="noopener">Obnovit heslo</a>\n</p>\n<p><i>Pokud jste o obnovení hesla nežádali, můžete tento e-mail ignorovat.</i></p>\n<p>\n  S pozdravem,<br/>\n  Tým {APP_NAME}\n</p>';

    usersCollection.confirmEmailChangeTemplate.body =
      '<p>Dobrý den,</p>\n<p>Kliknutím na tlačítko níže potvrdíte svou novou e-mailovou adresu.</p>\n<p>\n<a class="btn" href="{APP_URL}/api/pocketbase/email-link?action=confirm-email-change&token={TOKEN}" target="_blank" rel="noopener">Potvrdit nový e-mail</a>\n</p>\n<p><i>Pokud jste o změnu e-mailové adresy nežádali, můžete tento e-mail ignorovat.</i></p>\n<p>\n  S pozdravem,<br/>\n  Tým {APP_NAME}\n</p>';

    usersCollection.otp.emailTemplate.body =
      "<p>Dobrý den,</p>\n<p>Vaše jednorázové heslo je: <strong>{OTP}</strong></p>\n<p><i>Pokud jste o jednorázové heslo nežádali, můžete tento e-mail ignorovat.</i></p>\n<p>\n  S pozdravem,<br/>\n  Tým {APP_NAME}\n</p>";

    usersCollection.authAlert.emailTemplate.body =
      "<p>Dobrý den,</p>\n<p>Zaznamenali jsme přihlášení k vašemu účtu {APP_NAME} z nového místa:</p>\n<p><em>{ALERT_INFO}</em></p>\n<p><strong>Pokud jste to nebyli vy, měli byste si okamžitě změnit heslo k účtu {APP_NAME}, abyste zamezili přístupu ze všech ostatních míst.</strong></p>\n<p>Pokud jste to byli vy, můžete tento e-mail ignorovat.</p>\n<p>\n  S pozdravem,<br/>\n  Tým {APP_NAME}\n</p>";

    return app.save(usersCollection);
  }
);

function buildVerificationTemplate() {
  return renderAuthEmailLayout({
    title: "Ověřte svůj e-mail",
    intro: "Kliknutím na tlačítko níže ověříte svou e-mailovou adresu pro {APP_NAME}.",
    ctaLabel: "Ověřit e-mail",
    ctaHref: "{APP_URL}/api/pocketbase/email-link?action=verify-email&token={TOKEN}",
    noticeText: "Pokud jste o ověření e-mailové adresy nežádali, můžete tento e-mail ignorovat.",
  });
}

function buildResetPasswordTemplate() {
  return renderAuthEmailLayout({
    title: "Obnovte své heslo",
    intro: "Kliknutím na tlačítko níže obnovíte své heslo pro {APP_NAME}.",
    ctaLabel: "Obnovit heslo",
    ctaHref: "{APP_URL}/api/pocketbase/email-link?action=reset-password&token={TOKEN}",
    noticeText: "Pokud jste o obnovení hesla nežádali, můžete tento e-mail ignorovat.",
  });
}

function buildConfirmEmailChangeTemplate() {
  return renderAuthEmailLayout({
    title: "Potvrďte nový e-mail",
    intro: "Kliknutím na tlačítko níže potvrdíte svou novou e-mailovou adresu pro {APP_NAME}.",
    ctaLabel: "Potvrdit nový e-mail",
    ctaHref: "{APP_URL}/api/pocketbase/email-link?action=confirm-email-change&token={TOKEN}",
    noticeText: "Pokud jste o změnu e-mailové adresy nežádali, můžete tento e-mail ignorovat.",
  });
}

function buildOtpTemplate() {
  return renderAuthEmailLayout({
    title: "Jednorázové heslo",
    intro: "Pro přihlášení do {APP_NAME} použijte toto jednorázové heslo.",
    emphasizedValue: "{OTP}",
    noticeText: "Pokud jste o jednorázové heslo nežádali, můžete tento e-mail ignorovat.",
  });
}

function buildAuthAlertTemplate() {
  return renderAuthEmailLayout({
    title: "Přihlášení z nového místa",
    intro: "Zaznamenali jsme přihlášení k vašemu účtu {APP_NAME} z nového místa.",
    emphasizedValue: "{ALERT_INFO}",
    noticeText:
      "Pokud jste to nebyli vy, okamžitě si změňte heslo k účtu {APP_NAME}, abyste zamezili přístupu ze všech ostatních míst.",
    secondaryText: "Pokud jste to byli vy, můžete tento e-mail ignorovat.",
  });
}

function renderAuthEmailLayout({
  title,
  intro,
  ctaLabel,
  ctaHref,
  noticeText,
  emphasizedValue,
  secondaryText,
}) {
  return `
<div style="margin:0;padding:24px 12px;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827;">
  <div style="max-width:600px;margin:0 auto;">
    <div style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">
      <div style="margin-bottom:24px;">
        <a href="{APP_URL}" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none;">
          <img src="{APP_URL}/email/start-logo-email.png" alt="{APP_NAME}" width="150" height="40" style="display:block;border:0;outline:none;text-decoration:none;" />
        </a>
      </div>

      <h1 style="margin:0 0 16px;font-size:28px;line-height:36px;font-weight:700;color:#111827;">
        ${title}
      </h1>

      <p style="margin:0 0 16px;font-size:16px;line-height:26px;color:#111827;">
        ${intro}
      </p>

      ${
        emphasizedValue
          ? `
      <div style="margin:24px 0;padding:16px 18px;border:1px solid #e5e7eb;border-radius:12px;background-color:#f9fafb;font-size:20px;line-height:28px;font-weight:700;color:#111827;">
        ${emphasizedValue}
      </div>`
          : ""
      }

      ${
        ctaLabel && ctaHref
          ? `
      <div style="margin:24px 0;">
        <a
          href="${ctaHref}"
          target="_blank"
          rel="noopener"
          style="display:inline-block;border-radius:999px;background-color:#111827;color:#ffffff;padding:14px 24px;font-size:16px;font-weight:700;line-height:16px;text-decoration:none;"
        >
          ${ctaLabel}
        </a>
      </div>`
          : ""
      }

      <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#6b7280;">
        ${noticeText}
      </p>

      ${
        secondaryText
          ? `
      <p style="margin:0 0 24px;font-size:14px;line-height:22px;color:#6b7280;">
        ${secondaryText}
      </p>`
          : ""
      }

      ${
        ctaHref
          ? `
      <p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">
        Pokud tlačítko nefunguje, otevřete tuto adresu:
      </p>
      <p style="margin:8px 0 0;font-size:14px;line-height:22px;word-break:break-all;">
        <a
          href="${ctaHref}"
          target="_blank"
          rel="noopener"
          style="color:#111827;text-decoration:underline;"
        >
          ${ctaHref}
        </a>
      </p>`
          : ""
      }

      <hr style="margin:32px 0 24px;border:0;border-top:1px solid #e5e7eb;" />

      <p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#6b7280;">
        Potřebujete pomoc? Kontaktujte podporu nebo navštivte náš web.
      </p>
      <p style="margin:0 0 8px;font-size:14px;line-height:22px;color:#6b7280;">
        Podpora:
        <a href="mailto:support@gtdn.online" style="color:#111827;text-decoration:underline;">
          support@gtdn.online
        </a>
      </p>
      <p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">
        Web:
        <a href="{APP_URL}" target="_blank" rel="noopener" style="color:#111827;text-decoration:underline;">
          {APP_URL}
        </a>
      </p>
    </div>
  </div>
</div>`.trim();
}
