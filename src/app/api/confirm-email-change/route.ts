import { ClientResponseError } from "pocketbase";
import { NextRequest, NextResponse } from "next/server";
import { clearPocketBaseAuthCookie, createPocketBaseClient } from "@/lib/pocketbase/server";
import { authRedirectPaths } from "@/lib/auth-redirects";

type ConfirmEmailChangePayload = {
  token?: string;
  password?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ConfirmEmailChangePayload;
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!token || !password) {
      return NextResponse.json({ ok: false, errorCode: "BAD_REQUEST" }, { status: 400 });
    }

    const pb = createPocketBaseClient();

    await pb.collection("users").confirmEmailChange(token, password);

    const response = NextResponse.json(
      { ok: true, redirectTo: authRedirectPaths.login },
      { status: 200 }
    );
    clearPocketBaseAuthCookie(response);

    return response;
  } catch (error) {
    if (error instanceof ClientResponseError && error.status >= 400 && error.status < 500) {
      return NextResponse.json(
        { ok: false, errorCode: "INVALID_OR_EXPIRED_TOKEN_OR_PASSWORD" },
        { status: 400 }
      );
    }

    console.error("Confirm email change API error:", error);

    return NextResponse.json({ ok: false, errorCode: "INTERNAL_ERROR" }, { status: 500 });
  }
}
