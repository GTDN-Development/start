import { NextResponse } from "next/server";
import type { AuthErrorCode, AuthResponse } from "@/features/auth/auth-contract";
import { toAuthApiResponse, type ServerAuthResponse } from "@/server/auth/auth-service";

export function createAuthApiResponse<TData>(response: ServerAuthResponse<TData>) {
  const payload = toAuthApiResponse(response);
  const status = getAuthApiStatusCode(payload);
  const nextResponse = NextResponse.json(payload, {
    status,
  });

  if (response.setCookie?.length) {
    for (const cookieValue of response.setCookie) {
      nextResponse.headers.append("set-cookie", cookieValue);
    }
  }

  return nextResponse;
}

export function createAuthApiErrorResponse<TData>(errorCode: AuthErrorCode) {
  const response: AuthResponse<TData> = {
    ok: false,
    errorCode,
  };

  return NextResponse.json(response, {
    status: getAuthApiStatusCode(response),
  });
}

function getAuthApiStatusCode<TData>(response: AuthResponse<TData>) {
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
