onRecordCreateRequest(function defaultUserEmailVisibility(e) {
  e.record.set("emailVisibility", true);

  return e.next();
}, "users");

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
