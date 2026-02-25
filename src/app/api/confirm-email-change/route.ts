import { ClientResponseError } from "pocketbase";
import { NextRequest } from "next/server";
import { z } from "zod";
import { clearPocketBaseAuthCookie, createPocketBaseClient } from "@/server/pocketbase/server";
import { authRedirectPaths } from "@/features/auth/auth-redirects";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http/json";

const confirmEmailChangePayloadSchema = z.object({
  token: z.string().trim().min(1),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, confirmEmailChangePayloadSchema);

    if (!body) {
      return jsonError("BAD_REQUEST", 400);
    }

    const pb = createPocketBaseClient();

    await pb.collection("users").confirmEmailChange(body.token, body.password);

    const response = jsonOk({ redirectTo: authRedirectPaths.login }, 200);
    clearPocketBaseAuthCookie(response);

    return response;
  } catch (error) {
    if (error instanceof ClientResponseError && error.status >= 400 && error.status < 500) {
      return jsonError("INVALID_OR_EXPIRED_TOKEN_OR_PASSWORD", 400);
    }

    console.error("Confirm email change API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}
