import { ClientResponseError } from "pocketbase";
import { NextRequest, NextResponse } from "next/server";
import { clearPocketBaseAuthCookie, createPocketBaseClient } from "@/lib/pocketbase/server";
import { authRedirectPaths } from "@/lib/auth-redirects";

type ResetPasswordPayload = {
  token?: string;
  password?: string;
  confirmPassword?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ResetPasswordPayload;
    const token = typeof body.token === "string" ? body.token.trim() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ ok: false, errorCode: "BAD_REQUEST" }, { status: 400 });
    }

    if (password.length < 8 || confirmPassword.length < 8) {
      return NextResponse.json({ ok: false, errorCode: "BAD_REQUEST" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ ok: false, errorCode: "PASSWORD_MISMATCH" }, { status: 400 });
    }

    const pb = createPocketBaseClient();

    await pb.collection("users").confirmPasswordReset(token, password, confirmPassword);

    const response = NextResponse.json(
      { ok: true, redirectTo: authRedirectPaths.login },
      { status: 200 }
    );
    clearPocketBaseAuthCookie(response);

    return response;
  } catch (error) {
    if (error instanceof ClientResponseError && error.status >= 400 && error.status < 500) {
      return NextResponse.json({ ok: false, errorCode: "INVALID_OR_EXPIRED_TOKEN" }, { status: 400 });
    }

    console.error("Reset password API error:", error);

    return NextResponse.json({ ok: false, errorCode: "INTERNAL_ERROR" }, { status: 500 });
  }
}
