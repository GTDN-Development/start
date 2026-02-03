import { NextRequest, NextResponse } from "next/server";

type LoginPayload = {
  email?: string;
  password?: string;
  rememberMe?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as LoginPayload;

    if (!body.email || !body.password) {
      return NextResponse.json(
        { error: "Email and password are required." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { message: "Login request received. This is a stub response." },
      { status: 200 }
    );
  } catch (error) {
    console.error("Login API error:", error);
    return NextResponse.json(
      { error: "Unable to process the login request." },
      { status: 500 }
    );
  }
}
