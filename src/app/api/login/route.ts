import { ClientResponseError } from "pocketbase";
import { NextRequest } from "next/server";
import { z } from "zod";
import { createPocketBaseClient, setPocketBaseAuthCookie } from "@/lib/pocketbase/server";
import { authRedirectPaths } from "@/lib/auth-redirects";
import { jsonError, jsonOk, parseJsonBody } from "@/lib/api-route";

const loginPayloadSchema = z.object({
  email: z.string().trim().min(1).transform((value) => value.toLowerCase()),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, loginPayloadSchema);

    if (!body) {
      return jsonError("BAD_REQUEST", 400);
    }

    const pb = createPocketBaseClient();

    await pb.collection("users").authWithPassword(body.email, body.password);

    const response = jsonOk({ redirectTo: authRedirectPaths.dashboard }, 200);
    setPocketBaseAuthCookie(response, pb, { rememberMe: body.rememberMe });

    return response;
  } catch (error) {
    if (isInvalidCredentialsError(error)) {
      return jsonError("INVALID_CREDENTIALS", 401);
    }

    console.error("Login API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}

function isInvalidCredentialsError(error: unknown) {
  if (!(error instanceof ClientResponseError)) {
    return false;
  }

  return error.status === 400 || error.status === 401;
}
