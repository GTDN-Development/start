import { ClientResponseError } from "pocketbase";
import { NextRequest, NextResponse } from "next/server";
import { createPocketBaseClient, setPocketBaseAuthCookie } from "@/lib/pocketbase/server";

type SignUpPayload = {
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  termsAccepted?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SignUpPayload;
    const firstName = typeof body.firstName === "string" ? body.firstName.trim() : "";
    const lastName = typeof body.lastName === "string" ? body.lastName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    const confirmPassword = typeof body.confirmPassword === "string" ? body.confirmPassword : "";
    const termsAccepted = body.termsAccepted === true;

    if (!firstName || !lastName || !email || !password || !confirmPassword) {
      return NextResponse.json({ ok: false, errorCode: "BAD_REQUEST" }, { status: 400 });
    }

    if (password.length < 8 || confirmPassword.length < 8) {
      return NextResponse.json({ ok: false, errorCode: "BAD_REQUEST" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ ok: false, errorCode: "PASSWORD_MISMATCH" }, { status: 400 });
    }

    if (!termsAccepted) {
      return NextResponse.json({ ok: false, errorCode: "TERMS_NOT_ACCEPTED" }, { status: 400 });
    }

    const pb = createPocketBaseClient();

    await pb.collection("users").create({
      email,
      password,
      passwordConfirm: confirmPassword,
      name: `${firstName} ${lastName}`.trim(),
    });

    await requestVerificationEmail(pb, email);

    try {
      await pb.collection("users").authWithPassword(email, password);

      const response = NextResponse.json({ ok: true, redirectTo: "/dashboard" }, { status: 201 });
      setPocketBaseAuthCookie(response, pb);

      return response;
    } catch (error) {
      console.error("Sign-up auto-login skipped:", error);

      return NextResponse.json({ ok: true, redirectTo: "/login" }, { status: 201 });
    }
  } catch (error) {
    if (isEmailAlreadyInUseError(error)) {
      return NextResponse.json({ ok: false, errorCode: "EMAIL_ALREADY_IN_USE" }, { status: 409 });
    }

    if (error instanceof ClientResponseError && error.status >= 400 && error.status < 500) {
      return NextResponse.json({ ok: false, errorCode: "VALIDATION_ERROR" }, { status: 400 });
    }

    console.error("Sign-up API error:", error);

    return NextResponse.json({ ok: false, errorCode: "INTERNAL_ERROR" }, { status: 500 });
  }
}

function isEmailAlreadyInUseError(error: unknown) {
  if (!(error instanceof ClientResponseError)) {
    return false;
  }

  const data = getResponseData(error.response.data);
  const emailError = getResponseData(data.email);

  return emailError.code === "validation_not_unique";
}

async function requestVerificationEmail(pb: ReturnType<typeof createPocketBaseClient>, email: string) {
  try {
    await pb.collection("users").requestVerification(email);
  } catch (error) {
    console.error("Sign-up verification email request failed:", error);
  }
}

function getResponseData(value: unknown): Record<string, unknown> {
  if (typeof value === "object" && value !== null) {
    return value as Record<string, unknown>;
  }

  return {};
}
