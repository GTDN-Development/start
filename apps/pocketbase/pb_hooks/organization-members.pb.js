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
