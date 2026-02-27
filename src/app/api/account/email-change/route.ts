import { ClientResponseError } from "pocketbase";
import { NextRequest } from "next/server";
import { z } from "zod";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http/json";
import { getAuthenticatedUserApiContext } from "@/server/pocketbase/pb-authenticated-context";

const requestEmailChangePayloadSchema = z.object({
  newEmail: z
    .string()
    .trim()
    .transform((value) => value.toLowerCase())
    .pipe(z.email()),
});

export async function POST(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, requestEmailChangePayloadSchema);

    if (!body) {
      return jsonError("BAD_REQUEST", 400);
    }

    const userContext = getAuthenticatedUserApiContext(request);

    if (!userContext) {
      return jsonError("UNAUTHORIZED", 401);
    }

    const currentEmail = getAuthRecordEmail(userContext.authRecord);

    if (currentEmail && currentEmail.toLowerCase() === body.newEmail) {
      return jsonError("EMAIL_UNCHANGED", 400);
    }

    await userContext.pb.collection("users").requestEmailChange(body.newEmail);

    return jsonOk({ targetEmail: body.newEmail }, 200);
  } catch (error) {
    if (error instanceof ClientResponseError) {
      if (error.status === 400) {
        return jsonError("INVALID_OR_UNAVAILABLE_EMAIL", 400);
      }

      if (error.status === 401 || error.status === 403) {
        return jsonError("UNAUTHORIZED", 401);
      }
    }

    console.error("Request account email change API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}

function getAuthRecordEmail(record: unknown) {
  if (typeof record !== "object" || record === null) {
    return null;
  }

  const value = (record as Record<string, unknown>).email;

  return typeof value === "string" && value.trim() ? value : null;
}
