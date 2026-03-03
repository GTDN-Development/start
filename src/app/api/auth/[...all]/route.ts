import { NextRequest } from "next/server";
import type { AuthApiAction } from "@/features/auth/auth-contract";
import { signInInputSchema, signUpInputSchema } from "@/features/auth/auth-schemas";
import { createAuthApiErrorResponse, createAuthApiResponse } from "@/server/auth/auth-api-route";
import {
  getApiAuthSession,
  signInWithPassword,
  signOutServerSession,
  signUpWithPassword,
} from "@/server/auth/auth-service";
import { hasValidOrigin, parseRequestJson } from "@/server/http/request-utils";

const AUTH_ACTIONS: AuthApiAction[] = ["session", "sign-in", "sign-up", "sign-out"];

export async function GET(request: NextRequest) {
  const action = getActionFromRequest(request);

  if (action !== "session") {
    return createAuthApiErrorResponse("NOT_FOUND");
  }

  const result = await getApiAuthSession();

  return createAuthApiResponse(result);
}

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const action = getActionFromRequest(request);

  if (!action) {
    return createAuthApiErrorResponse("NOT_FOUND");
  }

  if (action === "sign-in") {
    const rawBody = await parseRequestJson(request);

    if (rawBody === null) {
      return createAuthApiErrorResponse("BAD_REQUEST");
    }

    const parsedInput = signInInputSchema.safeParse(rawBody);

    if (!parsedInput.success) {
      return createAuthApiErrorResponse("BAD_REQUEST");
    }

    const result = await signInWithPassword(parsedInput.data);

    return createAuthApiResponse(result);
  }

  if (action === "sign-up") {
    const rawBody = await parseRequestJson(request);

    if (rawBody === null) {
      return createAuthApiErrorResponse("BAD_REQUEST");
    }

    const parsedInput = signUpInputSchema.safeParse(rawBody);

    if (!parsedInput.success) {
      return createAuthApiErrorResponse("BAD_REQUEST");
    }

    const result = await signUpWithPassword(parsedInput.data);

    return createAuthApiResponse(result);
  }

  if (action === "sign-out") {
    const result = await signOutServerSession();

    return createAuthApiResponse(result);
  }

  return createAuthApiErrorResponse("NOT_FOUND");
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
