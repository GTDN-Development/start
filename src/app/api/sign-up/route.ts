import { NextRequest, NextResponse } from "next/server";

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

    if (
      !body.firstName ||
      !body.lastName ||
      !body.email ||
      !body.password ||
      !body.confirmPassword
    ) {
      return NextResponse.json(
        { error: "All fields are required." },
        { status: 400 }
      );
    }

    if (body.password !== body.confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match." }, { status: 400 });
    }

    if (!body.termsAccepted) {
      return NextResponse.json(
        { error: "You must accept the privacy policy." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Sign-up request received. This is a stub response." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Sign-up API error:", error);
    return NextResponse.json(
      { error: "Unable to process the sign-up request." },
      { status: 500 }
    );
  }
}
