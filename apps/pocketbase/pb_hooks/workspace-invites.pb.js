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

  return e.json(200, {
    state: "valid_guest",
  });
});
