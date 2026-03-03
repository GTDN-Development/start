import { NextRequest } from "next/server";
import { z } from "zod";
import { createAuthApiErrorResponse, createAuthApiResponse } from "@/server/auth/auth-api-route";
import { requestPasswordResetForEmail } from "@/server/auth/auth-service";
import { hasValidOrigin, parseRequestJson } from "@/server/http/request-utils";

const requestPasswordResetSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email()),
});

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const rawBody = await parseRequestJson(request);

  if (rawBody === null) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const parsedBody = requestPasswordResetSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const result = await requestPasswordResetForEmail(parsedBody.data.email);

  return createAuthApiResponse(result);
}
