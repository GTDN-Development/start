import { NextRequest, NextResponse } from "next/server";
import { clearPocketBaseAuthCookie } from "@/lib/pocketbase/server";

export async function POST(request: NextRequest) {
  if (!isSameOriginLogoutRequest(request)) {
    return NextResponse.json({ ok: false, errorCode: "FORBIDDEN" }, { status: 403 });
  }

  const redirectPath = await getRedirectPath(request);
  const response = NextResponse.redirect(new URL(redirectPath, request.url), { status: 303 });

  clearPocketBaseAuthCookie(response);

  return response;
}

async function getRedirectPath(request: NextRequest) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded") || contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    return sanitizeRedirectPath(formData.get("redirectTo"));
  }

  return sanitizeRedirectPath(null);
}

function sanitizeRedirectPath(value: FormDataEntryValue | null) {
  if (typeof value !== "string") {
    return "/login";
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return "/login";
  }

  return value;
}

function isSameOriginLogoutRequest(request: NextRequest) {
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
