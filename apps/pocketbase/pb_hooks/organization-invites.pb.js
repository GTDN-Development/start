routerAdd("POST", "/api/start/organizations", function createOrganization(e) {
  var ORGANIZATION_NAME_MAX_LENGTH = 32;
  var ORGANIZATION_SLUG_MAX_LENGTH = 48;
  var ORGANIZATION_SLUG_FALLBACK = "organization";
  var ORGANIZATION_KIND_ORGANIZATION = "organization";
  var ORGANIZATION_ROLE_OWNER = "owner";
  var requestInfo = e.requestInfo();
  var auth = requestInfo.auth;

  if (!auth) {
    throw new UnauthorizedError("Missing or invalid authentication.");
  }

  if (auth.collection().name !== "users") {
    throw new ForbiddenError("The request requires users authentication.");
  }

  var organizationName = normalizeOrganizationName(requestInfo.body && requestInfo.body.name);

  if (!organizationName) {
    throw new BadRequestError("Missing or invalid organization name.");
  }

  var requestedSlug = getNullableTrimmedString(requestInfo.body && requestInfo.body.slug);
  var createdOrganization = null;
  var createdMembership = null;

  e.app.runInTransaction(function createOrganizationTransaction(txApp) {
    var organizationCollection = txApp.findCollectionByNameOrId("organizations");
    var memberCollection = txApp.findCollectionByNameOrId("organization_members");
    var organization = new Record(organizationCollection, {
      name: organizationName,
      slug: resolveUniqueOrganizationSlug(txApp, requestedSlug || organizationName),
      kind: ORGANIZATION_KIND_ORGANIZATION,
      created_by: auth.id,
    });

    txApp.save(organization);

    var membership = new Record(memberCollection, {
      organization: organization.id,
      user: auth.id,
      role: ORGANIZATION_ROLE_OWNER,
    });

    txApp.save(membership);

    createdOrganization = organization;
    createdMembership = membership;
  });

  return e.json(200, {
    organization: serializeUserOrganization(createdOrganization, createdMembership),
  });

  function normalizeOrganizationName(value) {
    var normalizedValue = getNullableTrimmedString(value);

    if (!normalizedValue || normalizedValue.length > ORGANIZATION_NAME_MAX_LENGTH) {
      return null;
    }

    return normalizedValue;
  }

  function getNullableTrimmedString(value) {
    var normalizedValue = String(value || "").trim();

    return normalizedValue || null;
  }

  function resolveUniqueOrganizationSlug(app, rawValue) {
    var baseSlug = toOrganizationSlug(rawValue);

    for (var index = 0; index < 20; index += 1) {
      var suffix = index === 0 ? "" : "-" + (index + 1);
      var candidateBase = trimOrganizationSlugLength(
        baseSlug,
        ORGANIZATION_SLUG_MAX_LENGTH - suffix.length
      );
      var candidateSlug = candidateBase + suffix;
      var existingOrganization = findOrganizationBySlug(app, candidateSlug);

      if (!existingOrganization) {
        return candidateSlug;
      }
    }

    var fallbackSuffix = $security.randomStringWithAlphabet(4, "0123456789abcdef");
    var fallbackBase = trimOrganizationSlugLength(
      baseSlug,
      ORGANIZATION_SLUG_MAX_LENGTH - fallbackSuffix.length - 1
    );

    return fallbackBase + "-" + fallbackSuffix;
  }

  function toOrganizationSlug(value) {
    var normalizedValue = removeOrganizationSlugDiacritics(String(value || "").toLowerCase())
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return trimOrganizationSlugLength(
      normalizedValue || ORGANIZATION_SLUG_FALLBACK,
      ORGANIZATION_SLUG_MAX_LENGTH
    );
  }

  function removeOrganizationSlugDiacritics(value) {
    var normalizedValue = String(value || "");

    if (typeof normalizedValue.normalize === "function") {
      return normalizedValue.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
    }

    return normalizedValue
      .replace(/[\u00e0-\u00e5\u0101\u0103\u0105]/g, "a")
      .replace(/[\u00e7\u0107\u0109\u010b\u010d]/g, "c")
      .replace(/[\u010f\u0111]/g, "d")
      .replace(/[\u00e8-\u00eb\u0113\u0115\u0117\u0119\u011b]/g, "e")
      .replace(/[\u00ec-\u00ef\u0129\u012b\u012d\u012f]/g, "i")
      .replace(/[\u0142]/g, "l")
      .replace(/[\u00f1\u0144\u0146\u0148]/g, "n")
      .replace(/[\u00f2-\u00f6\u00f8\u014d\u014f\u0151]/g, "o")
      .replace(/[\u0155\u0157\u0159]/g, "r")
      .replace(/[\u015b\u015d\u015f\u0161]/g, "s")
      .replace(/[\u0163\u0165\u0167]/g, "t")
      .replace(/[\u00f9-\u00fc\u0169\u016b\u016d\u016f\u0171\u0173]/g, "u")
      .replace(/[\u00fd\u00ff\u0177]/g, "y")
      .replace(/[\u017a\u017c\u017e]/g, "z");
  }

  function trimOrganizationSlugLength(value, maxLength) {
    var normalizedValue = String(value || "")
      .slice(0, maxLength)
      .replace(/-+$/g, "");

    return normalizedValue || ORGANIZATION_SLUG_FALLBACK;
  }

  function findOrganizationBySlug(app, organizationSlug) {
    try {
      return app.findFirstRecordByData("organizations", "slug", organizationSlug);
    } catch (_) {
      return null;
    }
  }

  function serializeOrganization(organization) {
    return {
      id: organization.id,
      name: organization.getString("name"),
      slug: organization.getString("slug"),
      avatarUrl: null,
    };
  }

  function serializeUserOrganization(organization, membership) {
    var summary = serializeOrganization(organization);

    summary.membershipId = membership.id;
    summary.role = membership.getString("role");

    return summary;
  }
});

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

onRecordCreateRequest(function defaultUserEmailVisibility(e) {
  e.record.set("emailVisibility", true);

  return e.next();
}, "users");

onRecordUpdateRequest(function guardOrganizationMemberUpdate(e) {
  var ORGANIZATION_ROLE_OWNER = "owner";

  if (e.hasSuperuserAuth && e.hasSuperuserAuth()) {
    return e.next();
  }

  var originalRole = e.record.original().getString("role");
  var nextRole = e.record.getString("role");

  if (originalRole === ORGANIZATION_ROLE_OWNER && nextRole !== ORGANIZATION_ROLE_OWNER) {
    guardLastOrganizationOwner(e.app, e.record.getString("organization"));
  }

  return e.next();

  function guardLastOrganizationOwner(app, organizationId) {
    var ownerCount = app.countRecords(
      "organization_members",
      $dbx.hashExp({
        organization: organizationId,
        role: ORGANIZATION_ROLE_OWNER,
      })
    );

    if (ownerCount <= 1) {
      throw new BadRequestError("Organization must have at least one owner.", null);
    }
  }
}, "organization_members");

onRecordDeleteRequest(function guardOrganizationMemberDelete(e) {
  var ORGANIZATION_ROLE_OWNER = "owner";

  if (e.hasSuperuserAuth && e.hasSuperuserAuth()) {
    return e.next();
  }

  if (e.record.getString("role") !== ORGANIZATION_ROLE_OWNER) {
    return e.next();
  }

  var ownerCount = e.app.countRecords(
    "organization_members",
    $dbx.hashExp({
      organization: e.record.getString("organization"),
      role: ORGANIZATION_ROLE_OWNER,
    })
  );

  if (ownerCount <= 1) {
    throw new BadRequestError("Organization must have at least one owner.", null);
  }

  return e.next();
}, "organization_members");

onRecordDeleteRequest(function guardUserDelete(e) {
  var ORGANIZATION_ROLE_OWNER = "owner";

  if (e.hasSuperuserAuth && e.hasSuperuserAuth()) {
    return e.next();
  }

  var ownerMemberships = e.app.findRecordsByFilter(
    "organization_members",
    "user = {:userId} && role = {:ownerRole}",
    "",
    500,
    0,
    {
      userId: e.record.id,
      ownerRole: ORGANIZATION_ROLE_OWNER,
    }
  );

  for (var index = 0; index < ownerMemberships.length; index += 1) {
    var ownerCount = e.app.countRecords(
      "organization_members",
      $dbx.hashExp({
        organization: ownerMemberships[index].getString("organization"),
        role: ORGANIZATION_ROLE_OWNER,
      })
    );

    if (ownerCount <= 1) {
      throw new BadRequestError("Organization must have at least one owner.", null);
    }
  }

  return e.next();
}, "users");
