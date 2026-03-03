import { NextRequest } from "next/server";
import { z } from "zod";
import { createAuthApiErrorResponse, createAuthApiResponse } from "@/server/auth/auth-api-route";
import { confirmEmailChangeToken } from "@/server/auth/auth-service";
import { hasValidOrigin, parseRequestJson } from "@/server/http/request-utils";

const confirmEmailChangeSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const rawBody = await parseRequestJson(request);

  if (rawBody === null) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const parsedBody = confirmEmailChangeSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const result = await confirmEmailChangeToken(parsedBody.data);

  return createAuthApiResponse(result);
}
