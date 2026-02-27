import { ClientResponseError } from "pocketbase";
import { NextRequest } from "next/server";
import { z } from "zod";
import { getAccountProfileSnapshot } from "@/features/account/account-profile";
import { jsonError, jsonOk, parseJsonBody } from "@/server/http/json";
import {
  getAuthenticatedUserApiContext,
  refreshAuthenticatedUserApiSession,
  setAuthenticatedUserApiCookie,
} from "@/server/pocketbase/pb-authenticated-context";

const updateProfilePayloadSchema = z.object({
  name: z.string().trim().max(32),
});

export async function PATCH(request: NextRequest) {
  try {
    const body = await parseJsonBody(request, updateProfilePayloadSchema);

    if (!body) {
      return jsonError("BAD_REQUEST", 400);
    }

    const userContext = getAuthenticatedUserApiContext(request);

    if (!userContext) {
      return jsonError("UNAUTHORIZED", 401);
    }

    const updatedRecord = await userContext.pb.collection("users").update(userContext.userId, {
      name: body.name,
    });

    let profile = getAccountProfileSnapshot(updatedRecord);
    const hasRefreshedSession = await refreshAuthenticatedUserApiSession(userContext.pb);

    if (hasRefreshedSession && userContext.pb.authStore.record) {
      profile = getAccountProfileSnapshot(userContext.pb.authStore.record);
    }

    const response = jsonOk({ profile }, 200);

    if (hasRefreshedSession) {
      setAuthenticatedUserApiCookie(response, userContext.pb);
    }

    return response;
  } catch (error) {
    if (error instanceof ClientResponseError) {
      if (error.status === 400) {
        return jsonError("INVALID_PROFILE_INPUT", 400);
      }

      if (error.status === 401 || error.status === 403) {
        return jsonError("UNAUTHORIZED", 401);
      }
    }

    console.error("Update account profile API error:", error);

    return jsonError("INTERNAL_ERROR", 500);
  }
}
