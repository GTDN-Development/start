import { ClientResponseError } from "pocketbase";
import { NextRequest } from "next/server";
import { z } from "zod";
import { clearPocketBaseAuthCookie, createPocketBaseClient } from "@/server/pocketbase/pb-client";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http/json";
import { isSameOriginRequest } from "@/server/http/origin";
import { getAuthenticatedUserApiContext } from "@/server/pocketbase/pb-authenticated-context";

const deleteAccountPayloadSchema = z.object({
  password: z.string().min(1),
  acknowledged: z.literal(true),
});

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return jsonError("FORBIDDEN", 403);
  }

  try {
    const body = await parseJsonBody(request, deleteAccountPayloadSchema);

    if (!body) {
      return jsonError("BAD_REQUEST", 400);
    }

    const userContext = getAuthenticatedUserApiContext(request);

    if (!userContext) {
      return jsonError("UNAUTHORIZED", 401);
    }

    const userEmail = getAuthRecordEmail(userContext.authRecord);

    if (!userEmail) {
      return jsonError("UNAUTHORIZED", 401);
    }

    const reauthClient = createPocketBaseClient();

    try {
      await reauthClient.collection("users").authWithPassword(userEmail, body.password);
    } catch (error) {
      if (isInvalidCredentialsError(error)) {
        return jsonError("INVALID_CREDENTIALS", 401);
      }

      throw error;
    }

    const reauthenticatedUserId = getAuthRecordId(reauthClient.authStore.record);

    if (!reauthenticatedUserId || reauthenticatedUserId !== userContext.userId) {
      return jsonError("UNAUTHORIZED", 401);
    }

    await userContext.pb.collection("users").delete(userContext.userId);

    const response = jsonOk(200);
    clearPocketBaseAuthCookie(response);

    return response;
  } catch (error) {
    if (error instanceof ClientResponseError) {
      if (error.status === 401) {
        return jsonError("UNAUTHORIZED", 401);
      }

      if (error.status === 403) {
        return jsonError("DELETE_NOT_ALLOWED", 403);
      }

      if (error.status === 404) {
        return jsonError("NOT_FOUND", 404);
      }
    }

    console.error("Delete account API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}

function isInvalidCredentialsError(error: unknown) {
  if (!(error instanceof ClientResponseError)) {
    return false;
  }

  return error.status === 400 || error.status === 401;
}

function getAuthRecordId(record: unknown) {
  if (typeof record !== "object" || record === null) {
    return null;
  }

  const value = (record as Record<string, unknown>).id;

  return typeof value === "string" && value.trim() ? value : null;
}

function getAuthRecordEmail(record: unknown) {
  if (typeof record !== "object" || record === null) {
    return null;
  }

  const value = (record as Record<string, unknown>).email;

  return typeof value === "string" && value.trim() ? value.trim().toLowerCase() : null;
}
