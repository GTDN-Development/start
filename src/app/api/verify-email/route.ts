import { ClientResponseError } from "pocketbase";
import { NextRequest, NextResponse } from "next/server";
import {
  createServerPocketBaseClient,
  setPocketBaseAuthCookie,
} from "@/lib/pocketbase/server";

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

    const pb = await createServerPocketBaseClient();

    await pb.collection("users").confirmVerification(token);

    const redirectTo = pb.authStore.isValid && pb.authStore.record ? "/dashboard" : "/login";
    const response = NextResponse.json({ ok: true, redirectTo }, { status: 200 });

    if (pb.authStore.isValid && pb.authStore.record) {
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
