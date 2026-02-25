import { ClientResponseError } from "pocketbase";
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  POCKETBASE_AUTH_COOKIE_NAME,
  createPocketBaseClient,
  setPocketBaseAuthCookie,
} from "@/server/pocketbase/server";
import { authRedirectPaths } from "@/features/auth/auth-redirects";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http/json";

const verifyEmailPayloadSchema = z.object({
  token: z.string().trim().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, verifyEmailPayloadSchema);

    if (!body) {
      return jsonError("BAD_REQUEST", 400);
    }

    const pb = createPocketBaseClient();

    await pb.collection("users").confirmVerification(body.token);

    const hasRefreshedSession = await refreshSessionAfterVerification(pb, request);
    const response = jsonOk(
      {
        redirectTo: hasRefreshedSession ? authRedirectPaths.dashboard : authRedirectPaths.login,
      },
      200
    );

    if (hasRefreshedSession) {
      setPocketBaseAuthCookie(response, pb);
    }

    return response;
  } catch (error) {
    if (error instanceof ClientResponseError && error.status >= 400 && error.status < 500) {
      return jsonError("INVALID_OR_EXPIRED_TOKEN", 400);
    }

    console.error("Verify email API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}

async function refreshSessionAfterVerification(
  pb: ReturnType<typeof createPocketBaseClient>,
  request: NextRequest
) {
  const cookieHeader = request.headers.get("cookie") ?? "";

  if (!cookieHeader) {
    return false;
  }

  pb.authStore.loadFromCookie(cookieHeader, POCKETBASE_AUTH_COOKIE_NAME);

  if (!pb.authStore.isValid) {
    pb.authStore.clear();
    return false;
  }

  try {
    await pb.collection("users").authRefresh();
    return true;
  } catch (error) {
    console.error("Verify email auth refresh skipped:", error);
    pb.authStore.clear();
    return false;
  }
}
