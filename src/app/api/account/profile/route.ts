import { NextRequest } from "next/server";
import { z } from "zod";
import { createAuthApiErrorResponse, createAuthApiResponse } from "@/server/auth/auth-api-route";
import { updateCurrentUserProfileName } from "@/server/account/account-service";
import { hasValidOrigin, parseRequestJson } from "@/server/http/request-utils";

const updateProfileSchema = z.object({
  name: z.string().trim().max(32),
});

export async function PATCH(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const rawBody = await parseRequestJson(request);

  if (rawBody === null) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const parsedBody = updateProfileSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const result = await updateCurrentUserProfileName(parsedBody.data.name);

  return createAuthApiResponse(result);
}
