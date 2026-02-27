import { ClientResponseError } from "pocketbase";
import { NextRequest } from "next/server";
import { z } from "zod";
import { createPocketBaseClient } from "@/server/pocketbase/pb-client";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http/json";

const forgotPasswordPayloadSchema = z.object({
  email: z.string().trim().min(1).transform((value) => value.toLowerCase()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, forgotPasswordPayloadSchema);

    if (!body) {
      return jsonError("BAD_REQUEST", 400);
    }

    const pb = createPocketBaseClient();

    try {
      await pb.collection("users").requestPasswordReset(body.email);
    } catch (error) {
      if (!(error instanceof ClientResponseError) || error.status >= 500) {
        throw error;
      }
      // Return generic success for invalid/non-existing emails to avoid account enumeration.
    }

    return jsonOk(200);
  } catch (error) {
    console.error("Forgot password API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}
