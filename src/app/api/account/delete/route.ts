import { NextRequest } from "next/server";
import { z } from "zod";
import { createAuthApiErrorResponse, createAuthApiResponse } from "@/server/auth/auth-api-route";
import { deleteCurrentUserAccountWithPassword } from "@/server/account/account-service";
import { hasValidOrigin, parseRequestJson } from "@/server/http/request-utils";

const deleteAccountSchema = z.object({
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const rawBody = await parseRequestJson(request);

  if (rawBody === null) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const parsedBody = deleteAccountSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const result = await deleteCurrentUserAccountWithPassword(parsedBody.data.password);

  return createAuthApiResponse(result);
}
