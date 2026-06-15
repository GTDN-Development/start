routerAdd("POST", "/api/web/organizations", function createOrganization(e) {
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
