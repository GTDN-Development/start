const INTERNAL_SECRET_HEADER = "x-web-internal-token";
const GENERAL_FORMS_RECIPIENT_ENV = "GENERAL_FORMS_RECIPIENT";
const WEB_INTERNAL_API_SECRET_ENV = "WEB_INTERNAL_API_SECRET";
const SUPPORT_ATTACHMENTS_MAX_TOTAL_SIZE_BYTES = 8 * 1024 * 1024;
const INVITE_TTL_DAYS = 7;
const INVITE_RESEND_COOLDOWN_SECONDS = 60;
const INVITE_TOKEN_LENGTH = 64;
const INVITE_TOKEN_ALPHABET = "0123456789abcdef";

function requireInternalRequest(e) {
  const expectedSecret = getRequiredEnv(WEB_INTERNAL_API_SECRET_ENV);
  const providedSecret = getRequestHeader(e.requestInfo(), INTERNAL_SECRET_HEADER);

  if (!providedSecret || providedSecret !== expectedSecret) {
    throw new ForbiddenError("Invalid internal request.");
  }
}

function requireUsersAuth(requestInfo) {
  const auth = requestInfo.auth;

  if (!auth) {
    throw new UnauthorizedError("Missing or invalid authentication.");
  }

  if (auth.collection().name !== "users") {
    throw new ForbiddenError("The request requires users authentication.");
  }

  return auth;
}

function getRequiredEnv(name) {
  const value = String($os.getenv(name) || "").trim();

  if (!value) {
    throw new Error(name + " is required.");
  }

  return value;
}

function getRequestHeader(requestInfo, name) {
  const headers = requestInfo.headers || {};
  const lowerName = String(name).toLowerCase();
  const normalizedName = normalizeHeaderName(name);

  const directValue =
    getHeaderString(headers[name]) ||
    getHeaderString(headers[lowerName]) ||
    getHeaderString(headers[normalizedName]);

  if (directValue) {
    return directValue;
  }

  for (const key in headers) {
    if (normalizeHeaderName(key) === normalizedName) {
      return getHeaderString(headers[key]);
    }
  }

  return "";
}

function normalizeHeaderName(name) {
  return String(name).toLowerCase().replace(/-/g, "_");
}

function getHeaderString(value) {
  if (typeof value === "string") {
    return value.trim();
  }

  if (Array.isArray(value) && typeof value[0] === "string") {
    return value[0].trim();
  }

  return "";
}

function sendAppEmail(app, message) {
  const settings = app.settings();
  const senderAddress = String(settings.meta.senderAddress || "").trim();
  const senderName = String(settings.meta.senderName || "").trim();

  if (!senderAddress) {
    throw new Error("PocketBase senderAddress is required for email delivery.");
  }

  app.newMailClient().send(
    new MailerMessage({
      from: {
        address: senderAddress,
        name: senderName,
      },
      to: normalizeEmailAddresses(message.to),
      subject: message.subject,
      html: message.html,
      text: message.text,
      headers: message.replyTo ? { "Reply-To": String(message.replyTo).trim() } : undefined,
      attachments: message.attachments,
    })
  );
}

function normalizeEmailAddresses(value) {
  const values = Array.isArray(value) ? value : [value];

  return values
    .map(function mapAddress(address) {
      if (typeof address === "string") {
        return {
          address: address.trim(),
        };
      }

      return {
        address: String(address.address || "").trim(),
        name: String(address.name || "").trim(),
      };
    })
    .filter(function filterAddress(address) {
      return address.address;
    });
}

function createContactRequestEmail(input) {
  const subject = "Nová zpráva z kontaktního formuláře - " + input.fullName;
  const sections = [
    renderDetail("Jméno a příjmení", input.fullName),
    renderDetail("E-mail", input.email),
    renderDetail("Telefon", input.phone),
    renderDetail("Zpráva", input.message, { multiline: true }),
    renderDetail("Odesláno", formatDateTime(input.submittedAt)),
  ].join("");

  return {
    to: getRequiredEnv(GENERAL_FORMS_RECIPIENT_ENV),
    replyTo: input.email,
    subject,
    html: renderEmailLayout({
      previewText: "Nová zpráva z kontaktního formuláře",
      title: "Nová zpráva z kontaktního formuláře",
      bodyHtml: sections,
    }),
    text: [
      "Nová zpráva z kontaktního formuláře",
      "",
      "Jméno a příjmení: " + input.fullName,
      "E-mail: " + input.email,
      "Telefon: " + input.phone,
      "Zpráva:",
      input.message,
      "",
      "Odesláno: " + formatDateTime(input.submittedAt),
    ].join("\n"),
  };
}

function createSupportRequestEmail(input) {
  const attachmentCount = input.attachments ? Object.keys(input.attachments).length : 0;
  const subject = "Nová zpráva z formuláře podpory - " + input.email;
  const sections = [
    renderDetail("E-mail", input.email),
    renderDetail("Zpráva", input.message, { multiline: true }),
    attachmentCount > 0 ? renderDetail("Přílohy", formatCzechAttachmentCount(attachmentCount)) : "",
    renderDetail("Odesláno", formatDateTime(input.submittedAt)),
  ].join("");

  return {
    to: getRequiredEnv(GENERAL_FORMS_RECIPIENT_ENV),
    subject,
    html: renderEmailLayout({
      previewText: "Nová zpráva z formuláře podpory",
      title: "Nová zpráva z formuláře podpory",
      bodyHtml: sections,
    }),
    text: [
      "Nová zpráva z formuláře podpory",
      "",
      "E-mail: " + input.email,
      "Zpráva:",
      input.message,
      attachmentCount > 0 ? "Přílohy: " + formatCzechAttachmentCount(attachmentCount) : "",
      "",
      "Odesláno: " + formatDateTime(input.submittedAt),
    ]
      .filter(Boolean)
      .join("\n"),
    attachments: input.attachments,
  };
}

function createOrganizationInviteEmail(app, input) {
  const inviteUrl = createInviteUrl(app, input.inviteToken);
  const subject = "Pozvánka do organizace " + input.organizationName;
  const inviterLine = input.inviterName
    ? '<p style="margin:0 0 16px;font-size:16px;line-height:26px;color:#111827;">Pozval vás ' +
      escapeHtml(input.inviterName) +
      ".</p>"
    : '<p style="margin:0 0 16px;font-size:16px;line-height:26px;color:#111827;">Obdrželi jste pozvánku do organizace.</p>';

  return {
    to: input.email,
    subject,
    html: renderEmailLayout({
      previewText: "Pozvánka do organizace " + input.organizationName,
      title: "Pozvánka do organizace",
      bodyHtml:
        '<p style="margin:0 0 16px;font-size:16px;line-height:26px;color:#111827;">Byli jste pozváni do organizace ' +
        escapeHtml(input.organizationName) +
        ".</p>" +
        inviterLine +
        '<div style="margin:24px 0;"><a href="' +
        escapeAttribute(inviteUrl) +
        '" target="_blank" rel="noopener" style="display:inline-block;border-radius:999px;background-color:#111827;color:#ffffff;padding:14px 24px;font-size:16px;font-weight:700;line-height:16px;text-decoration:none;">Přijmout pozvánku</a></div>' +
        '<p style="margin:0 0 16px;font-size:16px;line-height:26px;color:#111827;">Pozvánka vyprší za ' +
        INVITE_TTL_DAYS +
        " dní.</p>" +
        '<p style="margin:24px 0 8px;font-size:14px;line-height:22px;color:#6b7280;">Pokud tlačítko nefunguje, otevřete tuto adresu:</p>' +
        '<p style="margin:0;font-size:14px;line-height:22px;word-break:break-all;"><a href="' +
        escapeAttribute(inviteUrl) +
        '" target="_blank" rel="noopener" style="color:#111827;text-decoration:underline;">' +
        escapeHtml(inviteUrl) +
        "</a></p>",
    }),
    text: [
      "Pozvánka do organizace",
      "",
      "Byli jste pozváni do organizace " + input.organizationName + ".",
      input.inviterName
        ? "Pozval vás " + input.inviterName + "."
        : "Obdrželi jste pozvánku do organizace.",
      "Pozvánka vyprší za " + INVITE_TTL_DAYS + " dní.",
      "",
      "Přijmout pozvánku: " + inviteUrl,
    ].join("\n"),
  };
}

function renderEmailLayout(input) {
  const appUrl = getAppUrl();
  const escapedAppUrl = escapeAttribute(appUrl);

  return (
    "<div style=\"margin:0;padding:24px 12px;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#111827;\">" +
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;">' +
    escapeHtml(input.previewText) +
    "</div>" +
    '<div style="max-width:600px;margin:0 auto;">' +
    '<div style="background-color:#ffffff;border:1px solid #e5e7eb;border-radius:16px;padding:32px;">' +
    '<div style="margin-bottom:24px;"><a href="' +
    escapedAppUrl +
    '" target="_blank" rel="noopener" style="display:inline-block;text-decoration:none;"><img src="' +
    escapedAppUrl +
    '/email/start-logo-email.png" alt="Start App" width="150" height="40" style="display:block;border:0;outline:none;text-decoration:none;" /></a></div>' +
    '<h1 style="margin:0 0 24px;font-size:28px;line-height:36px;font-weight:700;color:#111827;">' +
    escapeHtml(input.title) +
    "</h1>" +
    input.bodyHtml +
    '<hr style="margin:32px 0 24px;border:0;border-top:1px solid #e5e7eb;" />' +
    '<p style="margin:0 0 12px;font-size:14px;line-height:22px;color:#6b7280;">Potřebujete pomoc? Kontaktujte podporu nebo navštivte náš web.</p>' +
    '<p style="margin:0 0 8px;font-size:14px;line-height:22px;color:#6b7280;">Web: <a href="' +
    escapedAppUrl +
    '" target="_blank" rel="noopener" style="color:#111827;text-decoration:underline;">' +
    escapeHtml(appUrl) +
    "</a></p>" +
    "</div></div></div>"
  );
}

function renderDetail(label, value, options) {
  const normalizedValue = value === null || value === undefined ? "" : String(value);
  const valueHtml =
    options && options.multiline
      ? escapeHtml(normalizedValue).replace(/\n/g, "<br />")
      : escapeHtml(normalizedValue);

  return (
    '<div style="margin-bottom:20px;">' +
    '<p style="margin:0 0 6px;font-size:13px;line-height:20px;font-weight:700;color:#6b7280;text-transform:uppercase;letter-spacing:0.04em;">' +
    escapeHtml(label) +
    "</p>" +
    '<p style="margin:0;font-size:16px;line-height:26px;color:#111827;">' +
    valueHtml +
    "</p>" +
    "</div>"
  );
}

function getAppUrl() {
  const url = String($app.settings().meta.appURL || "").trim();

  if (!url) {
    throw new Error("PocketBase appURL is required for email rendering.");
  }

  return url.replace(/\/+$/g, "");
}

function createInviteUrl(app, inviteToken) {
  const baseUrl = String(app.settings().meta.appURL || "")
    .trim()
    .replace(/\/+$/g, "");

  if (!baseUrl) {
    throw new Error("PocketBase appURL is required for invite email rendering.");
  }

  return baseUrl + "/cs/invite/" + encodeURIComponent(inviteToken);
}

function formatDateTime(value) {
  const date = value instanceof Date ? value : new Date(value);

  if (!isFinite(date.getTime())) {
    return "";
  }

  const pragueTime = new DateTime(date.toISOString()).time().in(new Timezone("Europe/Prague"));

  return pragueTime.format("2. 1. 2006 15:04");
}

function formatCzechAttachmentCount(count) {
  if (count === 1) {
    return "1 příloha";
  }

  if (count >= 2 && count <= 4) {
    return count + " přílohy";
  }

  return count + " příloh";
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}

function normalizeEmail(value) {
  const normalizedEmail = String(value || "")
    .trim()
    .toLowerCase();

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) ? normalizedEmail : "";
}

function normalizeRequiredString(value, maxLength) {
  const normalizedValue = String(value || "").trim();

  if (!normalizedValue || (maxLength && normalizedValue.length > maxLength)) {
    return "";
  }

  return normalizedValue;
}

function createInviteToken() {
  return $security.randomStringWithAlphabet(INVITE_TOKEN_LENGTH, INVITE_TOKEN_ALPHABET);
}

function hashInviteToken(inviteToken) {
  return String($security.sha256(inviteToken));
}

function createInviteExpiryDate() {
  return new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

function isDateStringExpired(value) {
  const timestamp = Date.parse(String(value || ""));

  return !isFinite(timestamp) || timestamp <= Date.now();
}

function createAttachments(rawAttachments) {
  if (!Array.isArray(rawAttachments) || rawAttachments.length === 0) {
    return null;
  }

  let totalSize = 0;
  const attachments = {};

  for (let index = 0; index < rawAttachments.length; index += 1) {
    const rawAttachment = rawAttachments[index] || {};
    const filename = normalizeRequiredString(rawAttachment.filename, 200);
    const declaredSize = Number(rawAttachment.size || 0);
    const bytes = normalizeByteArray(rawAttachment.bytes);

    if (!filename || bytes.length === 0 || !Number.isFinite(declaredSize) || declaredSize < 0) {
      throw new BadRequestError("Invalid attachment.");
    }

    if (bytes.length !== declaredSize) {
      throw new BadRequestError("Invalid attachment size.");
    }

    totalSize += bytes.length;

    if (totalSize > SUPPORT_ATTACHMENTS_MAX_TOTAL_SIZE_BYTES) {
      throw new BadRequestError("Attachments are too large.");
    }

    const file = $filesystem.fileFromBytes(bytes, filename);
    attachments[filename] = file.reader.open();
  }

  return attachments;
}

function normalizeByteArray(value) {
  if (!Array.isArray(value)) {
    return [];
  }

  const bytes = [];

  for (let index = 0; index < value.length; index += 1) {
    const byte = Number(value[index]);

    if (!Number.isInteger(byte) || byte < 0 || byte > 255) {
      return [];
    }

    bytes.push(byte);
  }

  return bytes;
}

module.exports = {
  INVITE_RESEND_COOLDOWN_SECONDS,
  createAttachments,
  createContactRequestEmail,
  createInviteExpiryDate,
  createInviteToken,
  createOrganizationInviteEmail,
  createSupportRequestEmail,
  hashInviteToken,
  isDateStringExpired,
  normalizeEmail,
  normalizeRequiredString,
  requireInternalRequest,
  requireUsersAuth,
  sendAppEmail,
};
