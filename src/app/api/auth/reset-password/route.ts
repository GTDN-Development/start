import { NextRequest } from "next/server";
import { z } from "zod";
import { createAuthPasswordSchema } from "@/features/auth/auth-schemas";
import { createAuthApiErrorResponse, createAuthApiResponse } from "@/server/auth/auth-api-route";
import { confirmPasswordResetToken } from "@/server/auth/auth-service";
import { hasValidOrigin, parseRequestJson } from "@/server/http/request-utils";

const resetPasswordRequestSchema = z
  .object({
    token: z.string().trim().min(1),
    password: createAuthPasswordSchema(),
    confirmPassword: createAuthPasswordSchema(),
  })
  .superRefine((values, ctx) => {
    if (values.password !== values.confirmPassword) {
      ctx.addIssue({
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

  const parsedBody = resetPasswordRequestSchema.safeParse(rawBody);

  if (!parsedBody.success) {
    return createAuthApiErrorResponse("BAD_REQUEST");
  }

  const result = await confirmPasswordResetToken({
    token: parsedBody.data.token,
    password: parsedBody.data.password,
    confirmPassword: parsedBody.data.confirmPassword,
  });

  return createAuthApiResponse(result);
}
