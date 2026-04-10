routerAdd("POST", "/api/start/workspace-invites/inspect", function inspectWorkspaceInvite(e) {
  var requestInfo = e.requestInfo();
  var inviteToken = String((requestInfo.body && requestInfo.body.token) || "").trim();

  if (!inviteToken) {
    throw new BadRequestError("Missing invite token.");
  }

  var inviteRecord = null;

  try {
    inviteRecord = e.app.findFirstRecordByData(
      "workspace_invites",
      "token_hash",
      String($security.sha256(inviteToken))
    );
  } catch (_) {
    inviteRecord = null;
  }

  if (!inviteRecord) {
    return e.json(200, {
      state: "invalid_or_expired",
    });
  }

  var expiresAt = Date.parse(inviteRecord.getString("expires_at"));

  if (!isFinite(expiresAt) || expiresAt <= Date.now()) {
    return e.json(200, {
      state: "invalid_or_expired",
    });
  }

  if (!e.auth) {
    return e.json(200, {
      state: "valid_guest",
    });
  }

  var currentEmail = String(e.auth.getString("email") || "").trim().toLowerCase();
  var invitedEmail = String(inviteRecord.getString("email_normalized") || "").trim().toLowerCase();

  if (!currentEmail || invitedEmail !== currentEmail) {
    return e.json(200, {
      state: "email_mismatch",
      invitedEmail: invitedEmail,
      currentEmail: currentEmail,
    });
  }

  var workspaceId = String(inviteRecord.getString("workspace") || "").trim();

  if (!workspaceId) {
    return e.json(200, {
      state: "invalid_or_expired",
    });
  }

  var workspaceRecord = null;

  try {
    workspaceRecord = e.app.findFirstRecordByData("workspaces", "id", workspaceId);
  } catch (_) {
    workspaceRecord = null;
  }

  if (!workspaceRecord) {
    return e.json(200, {
      state: "invalid_or_expired",
    });
  }

  var membershipRecord = null;

  try {
    membershipRecord = e.app.findFirstRecordByFilter(
      "workspace_members",
      "workspace = {:workspaceId} && user = {:userId}",
      {
        workspaceId: workspaceId,
        userId: String(e.auth.id || ""),
      }
    );
  } catch (_) {
    membershipRecord = null;
  }

  return e.json(200, {
    state: membershipRecord ? "already_member" : "pending",
    workspaceId: workspaceId,
  });
});
