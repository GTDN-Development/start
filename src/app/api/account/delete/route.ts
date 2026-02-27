import { ClientResponseError } from "pocketbase";
import { NextRequest } from "next/server";
import { clearPocketBaseAuthCookie } from "@/server/pocketbase/pb-client";
import { jsonError, jsonOk } from "@/server/http/json";
import { isSameOriginRequest } from "@/server/http/origin";
import { getAuthenticatedUserApiContext } from "@/server/pocketbase/pb-authenticated-context";

export async function DELETE(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return jsonError("FORBIDDEN", 403);
  }

  try {
    const userContext = getAuthenticatedUserApiContext(request);

    if (!userContext) {
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
