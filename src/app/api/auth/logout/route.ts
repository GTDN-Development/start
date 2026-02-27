import { NextRequest, NextResponse } from "next/server";
import { clearPocketBaseAuthCookie } from "@/server/pocketbase/pb-client";
import { authRedirectPaths } from "@/features/auth/auth-redirects";
import { isSameOriginRequest } from "@/server/http/origin";

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
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
    return authRedirectPaths.login;
  }

  if (!value.startsWith("/") || value.startsWith("//")) {
    return authRedirectPaths.login;
  }

  return value;
}
