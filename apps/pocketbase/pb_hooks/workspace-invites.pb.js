routerAdd("POST", "/api/start/workspace-invites/inspect", function inspectWorkspaceInvite(e) {
  var data = new DynamicModel({
    token: "",
  });

  e.bindBody(data);

  var inviteToken = String(data.token || "").trim();

  if (!inviteToken) {
    throw new BadRequestError("Missing invite token.");
  }

  var inviteRecord = findInviteByTokenHash(e.app, $security.sha256(inviteToken));

  if (!inviteRecord || isInviteExpired(inviteRecord)) {
    return e.json(200, {
      state: "invalid_or_expired",
    });
  }

  return e.json(200, {
    state: "valid_guest",
  });
});

function findInviteByTokenHash(app, tokenHash) {
  var records = app.findRecordsByFilter(
    "workspace_invites",
    "token_hash = {:tokenHash}",
    "",
    1,
    0,
    {
      tokenHash: tokenHash,
    }
  );

  return records.length ? records[0] : null;
}

function isInviteExpired(invite) {
  var expiresAt = Date.parse(invite.getString("expires_at"));

  if (!isFinite(expiresAt)) {
    return true;
  }

  return expiresAt <= Date.now();
}
