import { ClientResponseError } from "pocketbase";
import { NextRequest, NextResponse } from "next/server";
import { createPocketBaseClient } from "@/lib/pocketbase/server";

type ForgotPasswordPayload = {
  email?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ForgotPasswordPayload;
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email) {
      return NextResponse.json({ ok: false, errorCode: "BAD_REQUEST" }, { status: 400 });
    }

    const pb = createPocketBaseClient();

    try {
      await pb.collection("users").requestPasswordReset(email);
    } catch (error) {
      if (!(error instanceof ClientResponseError) || error.status >= 500) {
        throw error;
      }
      // Return generic success for invalid/non-existing emails to avoid account enumeration.
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    console.error("Forgot password API error:", error);

    return NextResponse.json({ ok: false, errorCode: "INTERNAL_ERROR" }, { status: 500 });
  }
}
