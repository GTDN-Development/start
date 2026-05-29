function serializeOrganization(record, e) {
  return {
    id: record.id,
    name: record.getString("name"),
    slug: record.getString("slug"),
    avatarUrl: getOrganizationAvatarUrl(record, e),
  };
}

function getOrganizationAvatarUrl(record, e) {
  var avatar = getNullableTrimmedString(record.getString("avatar"));

  if (!avatar) {
    return null;
  }

  var origin = getPocketBaseOrigin(e);

  if (!origin) {
    return null;
  }

  return (
    origin +
    "/api/files/" +
    record.collection().id +
    "/" +
    record.id +
    "/" +
    encodeURIComponent(avatar)
  );
}

function getPocketBaseOrigin(e) {
  var host = String((e.request && e.request.host) || "").trim();

  if (!host) {
    return null;
  }

  return getPocketBaseRequestProtocol(e) + "://" + host.replace(/\/+$/g, "");
}

function getPocketBaseRequestProtocol(e) {
  var requestInfo = e.requestInfo();
  var forwardedProto = getForwardedProto(requestInfo.headers);

  if (forwardedProto) {
    return forwardedProto;
  }

  return typeof e.isTLS === "function" && e.isTLS() ? "https" : "http";
}

function getForwardedProto(headers) {
  if (!headers) {
    return null;
  }

  var headerValue =
    headers.x_forwarded_proto || headers["x-forwarded-proto"] || headers["X-Forwarded-Proto"];
  var rawValue = Array.isArray(headerValue) ? headerValue[0] : headerValue;
  var protocol = String(rawValue || "")
    .split(",")[0]
    .trim()
    .toLowerCase();

  return protocol === "http" || protocol === "https" ? protocol : null;
}

function getNullableTrimmedString(value) {
  var normalizedValue = String(value || "").trim();

  return normalizedValue || null;
}

module.exports = {
  serializeOrganization,
};
