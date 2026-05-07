routerAdd("POST", "/api/start/organization-invites/inspect", function inspectOrganizationInvite(e) {
  var requestInfo = e.requestInfo();
  var inviteToken = String((requestInfo.body && requestInfo.body.token) || "").trim();

  if (!inviteToken) {
    throw new BadRequestError("Missing invite token.");
  }

  var inviteRecord = findInviteByToken(e.app, inviteToken);

  if (!inviteRecord || isInviteExpired(inviteRecord)) {
    return e.json(200, {
      state: "invalid_or_expired",
    });
  }

  var auth = requestInfo.auth || null;

  if (!auth) {
    return e.json(200, {
      state: "valid_guest",
    });
  }

  if (auth.collection().name !== "users") {
    throw new ForbiddenError("The request requires users authentication.");
  }

  if (inviteRecord.getString("email_normalized") !== normalizeEmail(auth.getString("email"))) {
    return e.json(200, {
      state: "email_mismatch",
    });
  }

  var organization = findRecordById(e.app, "organizations", inviteRecord.getString("organization"));

  if (!organization) {
    safeDeleteRecord(e.app, inviteRecord);

    return e.json(200, {
      state: "invalid_or_expired",
    });
  }

  var membership = findOrganizationMembership(e.app, organization.id, auth.id);

  return e.json(200, {
    state: membership ? "already_member" : "pending",
    organization: serializeOrganization(organization),
  });

  function normalizeEmail(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function findInviteByToken(app, token) {
    try {
      return app.findFirstRecordByData(
        "organization_invites",
        "token_hash",
        String($security.sha256(token))
      );
    } catch (_) {
      return null;
    }
  }

  function findRecordById(app, collectionName, recordId) {
    try {
      return app.findRecordById(collectionName, recordId);
    } catch (_) {
      return null;
    }
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

  function isInviteExpired(record) {
    var expiresAt = Date.parse(record.getString("expires_at"));

    return !isFinite(expiresAt) || expiresAt <= Date.now();
  }

  function safeDeleteRecord(app, record) {
    try {
      app.delete(record);
    } catch (_) {}
  }

  function serializeOrganization(record) {
    return {
      id: record.id,
      name: record.getString("name"),
      slug: record.getString("slug"),
      avatarUrl: null,
    };
  }
});

routerAdd("POST", "/api/start/organization-invites/accept", function acceptOrganizationInvite(e) {
  var requestInfo = e.requestInfo();
  var auth = requestInfo.auth;

  if (!auth) {
    throw new UnauthorizedError("Missing or invalid authentication.");
  }

  if (auth.collection().name !== "users") {
    throw new ForbiddenError("The request requires users authentication.");
  }

  var inviteToken = String((requestInfo.body && requestInfo.body.token) || "").trim();

  if (!inviteToken) {
    throw new BadRequestError("Missing invite token.");
  }

  var acceptedResult = null;

  e.app.runInTransaction(function acceptOrganizationInviteTransaction(txApp) {
    var inviteRecord = findInviteByToken(txApp, inviteToken);

    if (!inviteRecord || isInviteExpired(inviteRecord)) {
      acceptedResult = {
        state: "invalid_or_expired",
      };
      return;
    }

    if (inviteRecord.getString("email_normalized") !== normalizeEmail(auth.getString("email"))) {
      acceptedResult = {
        state: "email_mismatch",
      };
      return;
    }

    var organization = findRecordById(
      txApp,
      "organizations",
      inviteRecord.getString("organization")
    );

    if (!organization) {
      safeDeleteRecord(txApp, inviteRecord);
      acceptedResult = {
        state: "invalid_or_expired",
      };
      return;
    }

    var membership = findOrganizationMembership(txApp, organization.id, auth.id);

    if (membership) {
      safeDeleteRecord(txApp, inviteRecord);
      acceptedResult = {
        state: "already_member",
        organization: serializeOrganization(organization),
      };
      return;
    }

    var memberCollection = txApp.findCollectionByNameOrId("organization_members");
    var nextMembership = new Record(memberCollection, {
      organization: organization.id,
      user: auth.id,
      role: inviteRecord.getString("role"),
    });

    txApp.save(nextMembership);
    safeDeleteRecord(txApp, inviteRecord);

    acceptedResult = {
      state: "accepted",
      organization: serializeOrganization(organization),
    };
  });

  return e.json(200, acceptedResult);

  function normalizeEmail(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function findInviteByToken(app, token) {
    try {
      return app.findFirstRecordByData(
        "organization_invites",
        "token_hash",
        String($security.sha256(token))
      );
    } catch (_) {
      return null;
    }
  }

  function findRecordById(app, collectionName, recordId) {
    try {
      return app.findRecordById(collectionName, recordId);
    } catch (_) {
      return null;
    }
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

  function isInviteExpired(record) {
    var expiresAt = Date.parse(record.getString("expires_at"));

    return !isFinite(expiresAt) || expiresAt <= Date.now();
  }

  function safeDeleteRecord(app, record) {
    try {
      app.delete(record);
    } catch (_) {}
  }

  function serializeOrganization(record) {
    return {
      id: record.id,
      name: record.getString("name"),
      slug: record.getString("slug"),
      avatarUrl: null,
    };
  }
});
