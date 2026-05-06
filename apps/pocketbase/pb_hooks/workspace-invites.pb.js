var WORKSPACE_NAME_MAX_LENGTH = 32;
var WORKSPACE_SLUG_MAX_LENGTH = 48;
var WORKSPACE_SLUG_FALLBACK = "workspace";
var WORKSPACE_KIND_ORGANIZATION = "organization";
var WORKSPACE_ROLE_OWNER = "owner";

routerAdd("POST", "/api/start/workspaces", function createWorkspace(e) {
  var requestInfo = e.requestInfo();
  var auth = requestInfo.auth;

  if (!auth) {
    throw new UnauthorizedError("Missing or invalid authentication.");
  }

  if (auth.collection().name !== "users") {
    throw new ForbiddenError("The request requires users authentication.");
  }

  var workspaceName = normalizeWorkspaceName(requestInfo.body && requestInfo.body.name);

  if (!workspaceName) {
    throw new BadRequestError("Missing or invalid workspace name.");
  }

  var requestedSlug = getNullableTrimmedString(requestInfo.body && requestInfo.body.slug);
  var createdWorkspace = null;
  var createdMembership = null;

  e.app.runInTransaction(function createWorkspaceTransaction(txApp) {
    var workspaceCollection = txApp.findCollectionByNameOrId("workspaces");
    var memberCollection = txApp.findCollectionByNameOrId("workspace_members");
    var workspace = new Record(workspaceCollection, {
      name: workspaceName,
      slug: resolveUniqueWorkspaceSlug(txApp, requestedSlug || workspaceName),
      kind: WORKSPACE_KIND_ORGANIZATION,
      created_by: auth.id,
    });

    txApp.save(workspace);

    var membership = new Record(memberCollection, {
      workspace: workspace.id,
      user: auth.id,
      role: WORKSPACE_ROLE_OWNER,
    });

    txApp.save(membership);

    createdWorkspace = workspace;
    createdMembership = membership;
  });

  return e.json(200, {
    workspace: serializeUserWorkspace(createdWorkspace, createdMembership),
  });

  function normalizeWorkspaceName(value) {
    var normalizedValue = getNullableTrimmedString(value);

    if (!normalizedValue || normalizedValue.length > WORKSPACE_NAME_MAX_LENGTH) {
      return null;
    }

    return normalizedValue;
  }

  function getNullableTrimmedString(value) {
    var normalizedValue = String(value || "").trim();

    return normalizedValue || null;
  }

  function resolveUniqueWorkspaceSlug(app, rawValue) {
    var baseSlug = toWorkspaceSlug(rawValue);

    for (var index = 0; index < 20; index += 1) {
      var suffix = index === 0 ? "" : "-" + (index + 1);
      var candidateBase = trimWorkspaceSlugLength(
        baseSlug,
        WORKSPACE_SLUG_MAX_LENGTH - suffix.length
      );
      var candidateSlug = candidateBase + suffix;
      var existingWorkspace = findWorkspaceBySlug(app, candidateSlug);

      if (!existingWorkspace) {
        return candidateSlug;
      }
    }

    var fallbackSuffix = $security.randomStringWithAlphabet(4, "0123456789abcdef");
    var fallbackBase = trimWorkspaceSlugLength(
      baseSlug,
      WORKSPACE_SLUG_MAX_LENGTH - fallbackSuffix.length - 1
    );

    return fallbackBase + "-" + fallbackSuffix;
  }

  function toWorkspaceSlug(value) {
    var normalizedValue = String(value || "")
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");

    return trimWorkspaceSlugLength(
      normalizedValue || WORKSPACE_SLUG_FALLBACK,
      WORKSPACE_SLUG_MAX_LENGTH
    );
  }

  function trimWorkspaceSlugLength(value, maxLength) {
    var normalizedValue = String(value || "")
      .slice(0, maxLength)
      .replace(/-+$/g, "");

    return normalizedValue || WORKSPACE_SLUG_FALLBACK;
  }

  function findWorkspaceBySlug(app, workspaceSlug) {
    try {
      return app.findFirstRecordByData("workspaces", "slug", workspaceSlug);
    } catch (_) {
      return null;
    }
  }

  function serializeWorkspace(workspace) {
    return {
      id: workspace.id,
      name: workspace.getString("name"),
      slug: workspace.getString("slug"),
      avatarUrl: null,
    };
  }

  function serializeUserWorkspace(workspace, membership) {
    var summary = serializeWorkspace(workspace);

    summary.membershipId = membership.id;
    summary.role = membership.getString("role");

    return summary;
  }
});

routerAdd("POST", "/api/start/workspace-invites/inspect", function inspectWorkspaceInvite(e) {
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

  var workspace = findRecordById(e.app, "workspaces", inviteRecord.getString("workspace"));

  if (!workspace) {
    safeDeleteRecord(e.app, inviteRecord);

    return e.json(200, {
      state: "invalid_or_expired",
    });
  }

  var membership = findWorkspaceMembership(e.app, workspace.id, auth.id);

  return e.json(200, {
    state: membership ? "already_member" : "pending",
    workspace: serializeWorkspace(workspace),
  });

  function normalizeEmail(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function findInviteByToken(app, token) {
    try {
      return app.findFirstRecordByData(
        "workspace_invites",
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

  function findWorkspaceMembership(app, workspaceId, userId) {
    try {
      return app.findFirstRecordByFilter(
        "workspace_members",
        "workspace = {:workspaceId} && user = {:userId}",
        {
          workspaceId: workspaceId,
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

  function serializeWorkspace(record) {
    return {
      id: record.id,
      name: record.getString("name"),
      slug: record.getString("slug"),
      avatarUrl: null,
    };
  }
});

routerAdd("POST", "/api/start/workspace-invites/accept", function acceptWorkspaceInvite(e) {
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

  e.app.runInTransaction(function acceptWorkspaceInviteTransaction(txApp) {
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

    var workspace = findRecordById(txApp, "workspaces", inviteRecord.getString("workspace"));

    if (!workspace) {
      safeDeleteRecord(txApp, inviteRecord);
      acceptedResult = {
        state: "invalid_or_expired",
      };
      return;
    }

    var membership = findWorkspaceMembership(txApp, workspace.id, auth.id);

    if (membership) {
      safeDeleteRecord(txApp, inviteRecord);
      acceptedResult = {
        state: "already_member",
        workspace: serializeWorkspace(workspace),
      };
      return;
    }

    var memberCollection = txApp.findCollectionByNameOrId("workspace_members");
    var nextMembership = new Record(memberCollection, {
      workspace: workspace.id,
      user: auth.id,
      role: inviteRecord.getString("role"),
    });

    txApp.save(nextMembership);
    safeDeleteRecord(txApp, inviteRecord);

    acceptedResult = {
      state: "accepted",
      workspace: serializeWorkspace(workspace),
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
        "workspace_invites",
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

  function findWorkspaceMembership(app, workspaceId, userId) {
    try {
      return app.findFirstRecordByFilter(
        "workspace_members",
        "workspace = {:workspaceId} && user = {:userId}",
        {
          workspaceId: workspaceId,
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

  function serializeWorkspace(record) {
    return {
      id: record.id,
      name: record.getString("name"),
      slug: record.getString("slug"),
      avatarUrl: null,
    };
  }
});

onRecordUpdateRequest(function guardWorkspaceMemberUpdate(e) {
  if (e.hasSuperuserAuth && e.hasSuperuserAuth()) {
    return e.next();
  }

  var originalRole = e.record.original().getString("role");
  var nextRole = e.record.getString("role");

  if (originalRole === WORKSPACE_ROLE_OWNER && nextRole !== WORKSPACE_ROLE_OWNER) {
    guardLastWorkspaceOwner(e.app, e.record.getString("workspace"));
  }

  return e.next();

  function guardLastWorkspaceOwner(app, workspaceId) {
    var ownerCount = app.countRecords(
      "workspace_members",
      $dbx.hashExp({
        workspace: workspaceId,
        role: WORKSPACE_ROLE_OWNER,
      })
    );

    if (ownerCount <= 1) {
      throw new BadRequestError("Workspace must have at least one owner.", null);
    }
  }
}, "workspace_members");

onRecordDeleteRequest(function guardWorkspaceMemberDelete(e) {
  if (e.hasSuperuserAuth && e.hasSuperuserAuth()) {
    return e.next();
  }

  if (e.record.getString("role") !== WORKSPACE_ROLE_OWNER) {
    return e.next();
  }

  var ownerCount = e.app.countRecords(
    "workspace_members",
    $dbx.hashExp({
      workspace: e.record.getString("workspace"),
      role: WORKSPACE_ROLE_OWNER,
    })
  );

  if (ownerCount <= 1) {
    throw new BadRequestError("Workspace must have at least one owner.", null);
  }

  return e.next();
}, "workspace_members");

onRecordDeleteRequest(function guardUserDelete(e) {
  if (e.hasSuperuserAuth && e.hasSuperuserAuth()) {
    return e.next();
  }

  var ownerMemberships = e.app.findRecordsByFilter(
    "workspace_members",
    "user = {:userId} && role = {:ownerRole}",
    "",
    500,
    0,
    {
      userId: e.record.id,
      ownerRole: WORKSPACE_ROLE_OWNER,
    }
  );

  for (var index = 0; index < ownerMemberships.length; index += 1) {
    var ownerCount = e.app.countRecords(
      "workspace_members",
      $dbx.hashExp({
        workspace: ownerMemberships[index].getString("workspace"),
        role: WORKSPACE_ROLE_OWNER,
      })
    );

    if (ownerCount <= 1) {
      throw new BadRequestError("Workspace must have at least one owner.", null);
    }
  }

  return e.next();
}, "users");
