import { NextRequest } from "next/server";
import { z } from "zod";
import { createAuthPasswordSchema } from "@/features/auth/auth-schemas";
import { updateCurrentUserPassword } from "@/server/account/account-service";
import { createAuthApiErrorResponse, createAuthApiResponse } from "@/server/auth/auth-api-route";
import { hasValidOrigin, parseRequestJson } from "@/server/http/request-utils";

const updatePasswordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: createAuthPasswordSchema(),
    confirmPassword: createAuthPasswordSchema(),
  })
  .superRefine((values, context) => {
    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({
        code: "custom",
        path: ["confirmPassword"],
      });
    }
  });

export async function POST(request: NextRequest) {
  if (!hasValidOrigin(request)) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const rawBody = await parseRequestJson(request);

  if (rawBody === null) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const parsedBody = updatePasswordSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const result = await updateCurrentUserPassword(parsedBody.data);

  return createAuthApiResponse(result);
}
