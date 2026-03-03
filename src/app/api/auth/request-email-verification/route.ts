import { NextRequest } from "next/server";
import { createAuthApiErrorResponse, createAuthApiResponse } from "@/server/auth/auth-api-route";
import { requestEmailVerificationForCurrentUser } from "@/server/auth/auth-service";
import { hasValidOrigin } from "@/server/http/request-utils";

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const result = await requestEmailVerificationForCurrentUser();

  return createAuthApiResponse(result);
}
