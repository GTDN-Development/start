const appEmail = require(`${__hooks}/lib/app-email.js`);

function createOrganizationInvite(e) {
  var requestInfo = e.requestInfo();
  var auth = appEmail.requireUsersAuth(requestInfo);
  var body = requestInfo.body || {};

  appEmail.requireInternalRequest(e);

  var organizationSlug = normalizeOrganizationSlug(body.organizationSlug);
  var emailNormalized = appEmail.normalizeEmail(body.email);
  var role = normalizeInviteRole(body.role);

  if (!organizationSlug || !emailNormalized || !role) {
    throw new BadRequestError("Missing or invalid organization invite.");
  }

  var inviteToken = appEmail.createInviteToken();
  var inviteEmailInput = null;
  var inviteSummary = null;

  e.app.runInTransaction(function createOrganizationInviteTransaction(txApp) {
    var organization = findOrganizationBySlug(txApp, organizationSlug);

    if (!organization) {
      throw new NotFoundError("Organization not found.");
    }

    requireOrganizationManager(txApp, organization.id, auth.id);

    var existingInvite = findInviteByEmail(txApp, organization.id, emailNormalized);

    if (existingInvite && !appEmail.isDateStringExpired(existingInvite.getString("expires_at"))) {
      throw new BadRequestError("Organization invite already exists.");
    }

    if (existingInvite) {
      safeDeleteRecord(txApp, existingInvite);
    }

    var invitedUser = findUserByEmail(txApp, emailNormalized);

    if (invitedUser && findOrganizationMembership(txApp, organization.id, invitedUser.id)) {
      throw new BadRequestError("User is already an organization member.");
    }

    var inviteCollection = txApp.findCollectionByNameOrId("organization_invites");
    var inviteRecord = new Record(inviteCollection, {
      organization: organization.id,
      email_normalized: emailNormalized,
      role: role,
      token_hash: appEmail.hashInviteToken(inviteToken),
      expires_at: appEmail.createInviteExpiryDate(),
      invited_by: auth.id,
    });

    txApp.save(inviteRecord);

    inviteSummary = serializeInvite(inviteRecord, auth);
    inviteEmailInput = {
      email: emailNormalized,
      organizationName: organization.getString("name"),
      inviterName: getNullableTrimmedString(auth.getString("name")),
      inviteToken: inviteToken,
    };
  });

  appEmail.sendAppEmail(e.app, appEmail.createOrganizationInviteEmail(e.app, inviteEmailInput));

  return e.json(200, {
    invite: inviteSummary,
  });
}

function resendOrganizationInvite(e) {
  var requestInfo = e.requestInfo();
  var auth = appEmail.requireUsersAuth(requestInfo);
  var body = requestInfo.body || {};

  appEmail.requireInternalRequest(e);

  var organizationSlug = normalizeOrganizationSlug(body.organizationSlug);
  var inviteId = getNullableTrimmedString(body.inviteId);

  if (!organizationSlug || !inviteId) {
    throw new BadRequestError("Missing or invalid organization invite.");
  }

  var inviteToken = appEmail.createInviteToken();
  var inviteEmailInput = null;
  var resendResult = null;

  e.app.runInTransaction(function resendOrganizationInviteTransaction(txApp) {
    var organization = findOrganizationBySlug(txApp, organizationSlug);

    if (!organization) {
      throw new NotFoundError("Organization not found.");
    }

    requireOrganizationManager(txApp, organization.id, auth.id);

    var inviteRecord = findInviteById(txApp, organization.id, inviteId);

    if (!inviteRecord) {
      throw new NotFoundError("Organization invite not found.");
    }

    if (appEmail.isDateStringExpired(inviteRecord.getString("expires_at"))) {
      safeDeleteRecord(txApp, inviteRecord);
      throw new BadRequestError("Organization invite is invalid or expired.");
    }

    var inviteLastUpdatedAt = Date.parse(inviteRecord.getString("updated"));

    if (
      isFinite(inviteLastUpdatedAt) &&
      Date.now() - inviteLastUpdatedAt < appEmail.INVITE_RESEND_COOLDOWN_SECONDS * 1000
    ) {
      throw new TooManyRequestsError("Organization invite resend is rate limited.");
    }

    inviteRecord.set("token_hash", appEmail.hashInviteToken(inviteToken));
    inviteRecord.set("expires_at", appEmail.createInviteExpiryDate());

    txApp.save(inviteRecord);

    resendResult = {
      inviteId: inviteRecord.id,
      expiresAt: inviteRecord.getString("expires_at"),
      updatedAt: inviteRecord.getString("updated"),
    };
    inviteEmailInput = {
      email: inviteRecord.getString("email_normalized"),
      organizationName: organization.getString("name"),
      inviterName: getNullableTrimmedString(auth.getString("name")),
      inviteToken: inviteToken,
    };
  });

  appEmail.sendAppEmail(e.app, appEmail.createOrganizationInviteEmail(e.app, inviteEmailInput));

  return e.json(200, resendResult);
}

function revokeOrganizationInvite(e) {
  var requestInfo = e.requestInfo();
  var auth = appEmail.requireUsersAuth(requestInfo);
  var body = requestInfo.body || {};

  appEmail.requireInternalRequest(e);

  var organizationSlug = normalizeOrganizationSlug(body.organizationSlug);
  var inviteId = getNullableTrimmedString(body.inviteId);

  if (!organizationSlug || !inviteId) {
    throw new BadRequestError("Missing or invalid organization invite.");
  }

  e.app.runInTransaction(function revokeOrganizationInviteTransaction(txApp) {
    var organization = findOrganizationBySlug(txApp, organizationSlug);

    if (!organization) {
      throw new NotFoundError("Organization not found.");
    }

    requireOrganizationManager(txApp, organization.id, auth.id);

    var inviteRecord = findInviteById(txApp, organization.id, inviteId);

    if (!inviteRecord) {
      throw new NotFoundError("Organization invite not found.");
    }

    safeDeleteRecord(txApp, inviteRecord);
  });

  return e.json(200, {
    revoked: true,
  });
}

function normalizeOrganizationSlug(value) {
  var normalizedValue = getNullableTrimmedString(value);

  if (!normalizedValue || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(normalizedValue)) {
    return null;
  }

  return normalizedValue;
}

function normalizeInviteRole(value) {
  var normalizedValue = getNullableTrimmedString(value);

  return normalizedValue === "admin" || normalizedValue === "member" ? normalizedValue : null;
}

function getNullableTrimmedString(value) {
  var normalizedValue = String(value || "").trim();

  return normalizedValue || null;
}

function findOrganizationBySlug(app, organizationSlug) {
  try {
    return app.findFirstRecordByData("organizations", "slug", organizationSlug);
  } catch (_) {
    return null;
  }
}

function findInviteById(app, organizationId, inviteId) {
  try {
    return app.findFirstRecordByFilter(
      "organization_invites",
      "id = {:inviteId} && organization = {:organizationId}",
      {
        inviteId: inviteId,
        organizationId: organizationId,
      }
    );
  } catch (_) {
    return null;
  }
}

function findInviteByEmail(app, organizationId, emailNormalized) {
  try {
    return app.findFirstRecordByFilter(
      "organization_invites",
      "organization = {:organizationId} && email_normalized = {:emailNormalized}",
      {
        organizationId: organizationId,
        emailNormalized: emailNormalized,
      }
    );
  } catch (_) {
    return null;
  }
}

function findUserByEmail(app, emailNormalized) {
  try {
    return app.findFirstRecordByData("users", "email", emailNormalized);
  } catch (_) {
    return null;
  }
}

function requireOrganizationManager(app, organizationId, userId) {
  var membership = findOrganizationMembership(app, organizationId, userId);

  if (!membership) {
    throw new ForbiddenError("Missing organization membership.");
  }

  var role = membership.getString("role");

  if (role !== "owner" && role !== "admin") {
    throw new ForbiddenError("The request requires organization owner or admin access.");
  }

  return membership;
}

function findOrganizationMembership(app, organizationId, userId) {
  try {
    return app.findFirstRecordByFilter(
      "organization_members",
      "organization = {:organizationId} && user = {:userId}",
      {
        organizationId: organizationId,
        userId: userId,
      }
    );
  } catch (_) {
    return null;
  }
}

function safeDeleteRecord(app, record) {
  try {
    app.delete(record);
  } catch (_) {}
}

function serializeInvite(inviteRecord, invitedBy) {
  return {
    id: inviteRecord.id,
    emailNormalized: inviteRecord.getString("email_normalized"),
    role: inviteRecord.getString("role"),
    expiresAt: inviteRecord.getString("expires_at"),
    updatedAt: inviteRecord.getString("updated"),
    invitedByName: getNullableTrimmedString(invitedBy.getString("name")),
  };
}

module.exports = {
  createOrganizationInvite,
  resendOrganizationInvite,
  revokeOrganizationInvite,
};
