import { NextRequest } from "next/server";
import { z } from "zod";
import { createAuthApiErrorResponse, createAuthApiResponse } from "@/server/auth/auth-api-route";
import { requestEmailChangeForCurrentUser } from "@/server/account/account-service";
import { hasValidOrigin, parseRequestJson } from "@/server/http/request-utils";

const requestEmailChangeSchema = z.object({
  newEmail: z.string().trim().toLowerCase().pipe(z.email()),
});

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const rawBody = await parseRequestJson(request);

  if (rawBody === null) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const parsedBody = requestEmailChangeSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const result = await requestEmailChangeForCurrentUser(parsedBody.data.newEmail);

  return createAuthApiResponse(result);
}
