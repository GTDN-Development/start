import { ClientResponseError } from "pocketbase";
import { NextRequest, NextResponse } from "next/server";
import { createPocketBaseClient } from "@/lib/pocketbase/server";

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

    return NextResponse.json({ ok: true, redirectTo: "/login" }, { status: 200 });
  } catch (error) {
    if (error instanceof ClientResponseError && error.status >= 400 && error.status < 500) {
      return NextResponse.json({ ok: false, errorCode: "INVALID_OR_EXPIRED_TOKEN" }, { status: 400 });
    }

    console.error("Verify email API error:", error);

    return NextResponse.json({ ok: false, errorCode: "INTERNAL_ERROR" }, { status: 500 });
  }
}
