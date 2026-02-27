export function isSameOriginRequest(request: Pick<Request, "url" | "headers">) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");

  if (origin) {
    return isSameOriginUrl(origin, expectedOrigin);
  }

  const referer = request.headers.get("referer");

  if (referer) {
    return isSameOriginUrl(referer, expectedOrigin);
  }

  return false;
}

function isSameOriginUrl(value: string, expectedOrigin: string) {
  try {
    return new URL(value).origin === expectedOrigin;
  } catch {
    return false;
  }
}
