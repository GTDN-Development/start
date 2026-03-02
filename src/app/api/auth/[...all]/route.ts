import { NextRequest, NextResponse } from "next/server";
import type {
  AuthApiAction,
  AuthErrorCode,
  AuthResponse,
  AuthSessionPayload,
  AuthSignOutPayload,
} from "@/features/auth/auth-contract";
import { signInInputSchema, signUpInputSchema } from "@/features/auth/auth-schemas";
import {
  getApiAuthSession,
  signInWithPassword,
  signOutServerSession,
  signUpWithPassword,
  toAuthApiResponse,
  type ServerAuthResponse,
} from "@/server/auth/auth-service";

const AUTH_ACTIONS: AuthApiAction[] = ["session", "sign-in", "sign-up", "sign-out"];

export async function GET(request: NextRequest) {
  const action = getActionFromRequest(request);

  if (action !== "session") {
    return createErrorResponse("NOT_FOUND");
  }

  const result = await getApiAuthSession();

  return createAuthResponse(result);
}

export async function POST(request: NextRequest) {
  const action = getActionFromRequest(request);

  if (!action) {
    return createErrorResponse("NOT_FOUND");
  }

  if (action === "sign-in") {
    const rawBody = await parseRequestJson(request);

    if (rawBody === null) {
      return createErrorResponse("BAD_REQUEST");
    }

    const parsedInput = signInInputSchema.safeParse(rawBody);

    if (!parsedInput.success) {
      return createErrorResponse("BAD_REQUEST");
    }

    const result = await signInWithPassword(parsedInput.data);

    return createAuthResponse(result);
  }

  if (action === "sign-up") {
    const rawBody = await parseRequestJson(request);

    if (rawBody === null) {
      return createErrorResponse("BAD_REQUEST");
    }

    const parsedInput = signUpInputSchema.safeParse(rawBody);

    if (!parsedInput.success) {
      return createErrorResponse("BAD_REQUEST");
    }

    const result = await signUpWithPassword(parsedInput.data);

    return createAuthResponse(result);
  }

  if (action === "sign-out") {
    const result = await signOutServerSession();

    return createAuthResponse(result);
  }

  return createErrorResponse("NOT_FOUND");
}

function getActionFromRequest(request: NextRequest): AuthApiAction | null {
  const pathname = request.nextUrl.pathname;
  const segments = pathname.split("/").filter(Boolean);

  if (segments.length < 3) {
    return null;
  }

  const action = segments[segments.length - 1];

  if (!isAuthApiAction(action)) {
    return null;
  }

  return action;
}

function isAuthApiAction(value: string): value is AuthApiAction {
  return AUTH_ACTIONS.includes(value as AuthApiAction);
}

function createAuthResponse<TData>(response: ServerAuthResponse<TData>) {
  const payload = toAuthApiResponse(response);
  const status = getStatusCode(payload);
  const nextResponse = NextResponse.json(payload, {
    status,
  });

  if (response.setCookie) {
    nextResponse.headers.set("set-cookie", response.setCookie);
  }

  return nextResponse;
}

function createErrorResponse(errorCode: AuthErrorCode) {
  const response: AuthResponse<AuthSessionPayload | AuthSignOutPayload> = {
    ok: false,
    errorCode,
  };

  return NextResponse.json(response, {
    status: getStatusCode(response),
  });
}

function getStatusCode<TData>(response: AuthResponse<TData>) {
  if (response.ok) {
    return 200;
  }

  switch (response.errorCode) {
    case "BAD_REQUEST":
      return 400;
    case "INVALID_CREDENTIALS":
      return 401;
    case "UNAUTHORIZED":
      return 401;
    case "EMAIL_ALREADY_IN_USE":
      return 409;
    case "VALIDATION_ERROR":
      return 400;
    case "WEAK_PASSWORD":
      return 400;
    case "RATE_LIMITED":
      return 429;
    case "NOT_FOUND":
      return 404;
    case "UNKNOWN_ERROR":
      return 500;
    default:
      return 500;
  }
}

async function parseRequestJson(request: Request) {
  try {
    return (await request.json()) as unknown;
  } catch {
    return null;
  }
}
