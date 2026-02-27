import { ClientResponseError } from "pocketbase";
import { NextRequest } from "next/server";
import { z } from "zod";
import { clearPocketBaseAuthCookie, createPocketBaseClient } from "@/server/pocketbase/pb-client";
import { authRedirectPaths } from "@/features/auth/auth-redirects";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http/json";

const resetPasswordPayloadSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(8),
  confirmPassword: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, resetPasswordPayloadSchema);

    if (!body) {
      return jsonError("BAD_REQUEST", 400);
    }

    if (body.password !== body.confirmPassword) {
      return jsonError("PASSWORD_MISMATCH", 400);
    }

    const pb = createPocketBaseClient();

    await pb.collection("users").confirmPasswordReset(body.token, body.password, body.confirmPassword);

    const response = jsonOk({ redirectTo: authRedirectPaths.login }, 200);
    clearPocketBaseAuthCookie(response);

    return response;
  } catch (error) {
    if (error instanceof ClientResponseError && error.status >= 400 && error.status < 500) {
      return jsonError("INVALID_OR_EXPIRED_TOKEN", 400);
    }

    console.error("Reset password API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}
