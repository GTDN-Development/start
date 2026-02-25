import { ClientResponseError } from "pocketbase";
import { NextRequest, NextResponse } from "next/server";
import { createPocketBaseClient, setPocketBaseAuthCookie } from "@/lib/pocketbase/server";
import { authRedirectPaths } from "@/lib/auth-redirects";

type LoginPayload = {
  email?: string;
  password?: string;
  rememberMe?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginPayload;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const rememberMe = body.rememberMe === true;

    if (!email || !password) {
      return NextResponse.json({ ok: false, errorCode: "BAD_REQUEST" }, { status: 400 });
    }

    const pb = createPocketBaseClient();

    await pb.collection("users").authWithPassword(email, password);

    const response = NextResponse.json(
      { ok: true, redirectTo: authRedirectPaths.dashboard },
      { status: 200 }
    );
    setPocketBaseAuthCookie(response, pb, { rememberMe });

    return response;
  } catch (error) {
    if (isInvalidCredentialsError(error)) {
      return NextResponse.json({ ok: false, errorCode: "INVALID_CREDENTIALS" }, { status: 401 });
    }

    console.error("Login API error:", error);

    return NextResponse.json({ ok: false, errorCode: "INTERNAL_ERROR" }, { status: 500 });
  }
}

function isInvalidCredentialsError(error: unknown) {
  if (!(error instanceof ClientResponseError)) {
    return false;
  }

  return error.status === 400 || error.status === 401;
}
