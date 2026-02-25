import { ClientResponseError } from "pocketbase";
import { NextRequest, NextResponse } from "next/server";
import {
  POCKETBASE_AUTH_COOKIE_NAME,
  createPocketBaseClient,
  setPocketBaseAuthCookie,
} from "@/lib/pocketbase/server";
import { authRedirectPaths } from "@/lib/auth-redirects";

type VerifyEmailPayload = {
  token?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as VerifyEmailPayload;
    const token = typeof body.token === "string" ? body.token.trim() : "";

    if (!token) {
      return NextResponse.json({ ok: false, errorCode: "BAD_REQUEST" }, { status: 400 });
    }

    const pb = createPocketBaseClient();

    await pb.collection("users").confirmVerification(token);

    const hasRefreshedSession = await refreshSessionAfterVerification(pb, request);
    const response = NextResponse.json(
      {
        ok: true,
        redirectTo: hasRefreshedSession ? authRedirectPaths.dashboard : authRedirectPaths.login,
      },
      { status: 200 }
    );

    if (hasRefreshedSession) {
      setPocketBaseAuthCookie(response, pb);
    }

    return response;
  } catch (error) {
    if (error instanceof ClientResponseError && error.status >= 400 && error.status < 500) {
      return NextResponse.json({ ok: false, errorCode: "INVALID_OR_EXPIRED_TOKEN" }, { status: 400 });
    }

    console.error("Verify email API error:", error);

    return NextResponse.json({ ok: false, errorCode: "INTERNAL_ERROR" }, { status: 500 });
  }
}

async function refreshSessionAfterVerification(
  pb: ReturnType<typeof createPocketBaseClient>,
  request: NextRequest
) {
  const cookieHeader = request.headers.get("cookie") ?? "";

  if (!cookieHeader) {
    return false;
  }

  pb.authStore.loadFromCookie(cookieHeader, POCKETBASE_AUTH_COOKIE_NAME);

  if (!pb.authStore.isValid) {
    pb.authStore.clear();
    return false;
  }

  try {
    await pb.collection("users").authRefresh();
    return true;
  } catch (error) {
    console.error("Verify email auth refresh skipped:", error);
    pb.authStore.clear();
    return false;
  }
}
